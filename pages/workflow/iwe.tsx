import { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { ArrowLeft, SendHorizontal, Workflow as WorkflowIcon, Files, Plus, Loader2, MessageSquare } from 'lucide-react';
import Link from "next/link";
import { parseWorkflowFromText, ParsedWorkflow } from "@/lib/workflow-parser";
import { marked } from 'marked';

// Configure marked for better chat rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

interface Workflow {
  id: number;
  name: string;
  description: string | null;
  status: string;
  executionCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ChatThread {
  id: number;
  title: string;
  lastMessageAt: string;
  createdAt: string;
}

interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  createdAt?: string;
  parsedWorkflow?: ParsedWorkflow; // Parsed workflow data if message contains workflow syntax
}

export default function WorkflowBuilderPage() {
  const { data: session, status } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState("");
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [sidePanel, setSidePanel] = useState<'workflows' | 'files' | 'chats'>('workflows');
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<number | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const openSidePanel = (panel: 'workflows' | 'files') => {
    setSidePanel(panel);
  }

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    fetchWorkflows();
    fetchChatThreads();
  }, [session, status, router]);

  // Fetch messages when current thread changes
  useEffect(() => {
    if (currentThreadId) {
      fetchChatHistory(currentThreadId);
    } else {
      setChatHistory([]);
    }
  }, [currentThreadId]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/workflows");
      const data = await response.json();

      if (data.success) {
        setWorkflows(data.workflows || []);
      } else {
        setError(data.message || "Failed to fetch workflows");
      }
    } catch (err) {
      setError("An error occurred while fetching workflows");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatThreads = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/workflow");
      const data = await response.json();

      if (data.success) {
        setChatThreads(data.threads || []);
        // If no current thread selected and we have threads, select the most recent one
        if (!currentThreadId && data.threads && data.threads.length > 0) {
          setCurrentThreadId(data.threads[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch chat threads:", err);
    }
  }, [currentThreadId]);

  const fetchChatHistory = useCallback(async (threadId?: number) => {
    const targetThreadId = threadId || currentThreadId;
    if (!targetThreadId) return;

    try {
      const response = await fetch(`/api/chat/workflow?threadId=${targetThreadId}`);
      const data = await response.json();

      if (data.success) {
        const messages: ChatMessage[] = data.messages.map((msg: { id: number; role: string; content: string; createdAt: string }) => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          createdAt: msg.createdAt,
        }));

        // Parse workflows from assistant messages
        const messagesWithWorkflows = messages.map(msg => {
          if (msg.role === 'assistant') {
            const parseResult = parseWorkflowFromText(msg.content);
            return {
              ...msg,
              parsedWorkflow: parseResult.workflow || undefined
            };
          }
          return msg;
        });

        setChatHistory(messagesWithWorkflows);
      }
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
    }
  }, [currentThreadId]);

  const handleCreateWorkflow = async (parsedWorkflow: ParsedWorkflow, messageId?: number) => {
    try {
      // Create the workflow
      const createResponse = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: parsedWorkflow.name,
          description: parsedWorkflow.description
        }),
      });

      const createData = await createResponse.json();

      if (!createData.success) {
        throw new Error(createData.message || 'Failed to create workflow');
      }

      const workflowId = createData.workflow.id;

      // Save the workflow nodes and connections
      const saveResponse = await fetch(`/api/workflow/${workflowId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes: parsedWorkflow.nodes,
          connections: parsedWorkflow.connections
        }),
      });

      const saveData = await saveResponse.json();

      if (!saveData.success) {
        throw new Error(saveData.message || 'Failed to save workflow');
      }

      // If we have a messageId, update the chat messages to link to this workflow
      if (messageId) {
        // Update the workflowId for all messages in this conversation
        // This is a bit complex, so for now we'll just proceed
      }

      // Redirect to the workflow builder
      router.push(`/workflow/${workflowId}`);

    } catch (error) {
      console.error('Workflow creation error:', error);
      alert('Failed to create workflow. Please try again.');
    }
  };

  const handleChatSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const promptInput = form.elements.namedItem('prompt') as HTMLInputElement;
    const prompt = promptInput.value;
    if (!prompt.trim()) return;

    const systemPrompt = `
Your are a helful assistant that can create workflows and maange them.

You can create a workflow by using the following syntax:

workflow:
  name: Send Actionable Summary in Slack
  description: Send a summary of the next steps based on the notes from the user into their Slack channel.
  nodes:
    - type: form
      fields:
        - name: notes
          label: Notes
          type: textarea
          required: true

    - type: ai
      systemPrompt: You are a helpful assistant that summarized the next steps based on the notes from the user.
      model: gpt-3.5-turbo

    - type: slack
      channel: summary
`

    // Add user message to history
    const userMessage: ChatMessage = {
      role: 'user',
      content: prompt,
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, userMessage]);

    // Clear input and set loading state
    promptInput.value = '';
    setIsLoading(true);
    setIsTyping(true);

    try {
      const apiResponse = await fetch('/api/chat/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: 'gpt-3.5-turbo',
          systemPrompt,
          history: chatHistory,
          threadId: currentThreadId
        }),
      });

      const data = await apiResponse.json();

      if (data.success) {
        // If this was a new thread, update the current thread ID and refresh threads
        if (data.threadId && data.threadId !== currentThreadId) {
          setCurrentThreadId(data.threadId);
          await fetchChatThreads();
        }

        // Refresh the current thread's messages
        await fetchChatHistory(data.threadId || currentThreadId);
      } else {
        throw new Error(data.message || 'Chat failed');
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Add error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }

  return (
    <div>
      <Head>
        <title>IWE - jjoist</title>
        <meta name="description" content="Interactive Workflow Engine" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="bg-[#3A3A3A] bg-gradient-to-b from-[#2B2B2B] to-[#3C3C3C] h-screen">
        <header className="flex items-center justify-between h-8 px-2 bg-[#424242] border-b border-[#4C4C4C]">
          <Link href="/workflows">
            <ArrowLeft className="text-white hover:text-[#a3e635] transition-colors p-1" />
          </Link>
        </header>
        <div className="h-[calc(100vh-4rem)] flex">
          {/* sidebar */}
          <div className="bg-[#424242] border-r border-[#4C4C4C] h-full w-10 flex flex-col items-center justify-start gap-2 py-2">
            <button onClick={() => openSidePanel('workflows')} className="cursor-pointer bg-[#424242] hover:bg-[#515151] transition-colors p-1 rounded-md">
              <WorkflowIcon className="text-white" />
            </button>
            <button onClick={() => openSidePanel('files')} className="cursor-pointer bg-[#424242] hover:bg-[#515151] transition-colors p-1 rounded-md">
              <Files className="text-white" />
            </button>
            <button onClick={() => openSidePanel('chats')} className="cursor-pointer bg-[#424242] hover:bg-[#515151] transition-colors p-1 rounded-md">
              <MessageSquare className="text-white" />
            </button>
          </div>

          {/* navigation */}
          <div className="flex flex-col h-full bg-[#424242] border-r border-[#3C3C3C] w-5/12">
            <nav className="flex h-8 bg-[#3C3C3C]">
              <button onClick={() => openSidePanel('workflows')} className={`px-4 ${sidePanel === 'workflows' ? 'bg-[#424242] text-white' : 'bg-[#3C3C3C] text-gray-400 cursor-pointer'}`}>Workflows</button>
              <button onClick={() => openSidePanel('files')} className={`px-4 ${sidePanel === 'files' ? 'bg-[#424242] text-white' : 'bg-[#3C3C3C] text-gray-400 cursor-pointer'}`}>Files</button>
              <button onClick={() => openSidePanel('chats')} className={`px-4 ${sidePanel === 'chats' ? 'bg-[#424242] text-white' : 'bg-[#3C3C3C] text-gray-400 cursor-pointer'}`}>Chats</button>
            </nav>

            <div className="flex flex-col gap-2 p-2 h-full overflow-y-auto">
              {sidePanel === 'workflows' && workflows.map((workflow, index) => (
                <Link href={`/workflow/${workflow.id}`}
                  key={index} className="flex flex-col justify-between h-24 p-2 bg-[#424242] border border-[#4C4C4C] rounded-md">
                  <h1 className="text-white font-semibold text-lg truncate">{workflow.name}</h1>
                  <p className="text-sm text-gray-400 truncate">{workflow.description || "Type to insert a description..."}</p>
                  <div className="flex items-center gap-2">
                    <div>
                      {workflow.executionCount}
                    </div>
                  </div>
                </Link>
              ))}

              {sidePanel === 'chats' && (
                <>
                  <button
                    onClick={() => setCurrentThreadId(null)}
                    className="flex items-center gap-2 p-1 pl-2 text-sm w-28 bg-[#a3e635] text-black rounded-md hover:bg-[#8bc329] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    New Chat
                  </button>
                  {chatThreads.map((thread, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentThreadId(thread.id)}
                      className={`flex flex-col justify-between h-18 text-left p-2 border rounded-md transition-colors cursor-pointer ${
                        currentThreadId === thread.id
                          ? 'bg-[#424242] text-white border-[#a3e635]'
                          : 'bg-[#424242] text-white border-[#4C4C4C] hover:bg-[#515151]'
                      }`}
                    >
                      <h1 className="text-md truncate">{thread.title}</h1>
                      <p className="text-sm text-gray-400">
                        {new Date(thread.lastMessageAt).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* chat */}
          <div className="flex flex-col justify-between h-full w-7/12">
            {/* history */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-[#a3e635] text-black'
                      : 'bg-[#424242] text-white'
                  }`}>
                    <div
                      className="text-sm prose prose-sm max-w-none prose-invert"
                      dangerouslySetInnerHTML={{
                        __html: marked(message.content, { breaks: true })
                      }}
                    />
                    <div className={`text-xs ${message.role === 'assistant' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                     {message.parsedWorkflow && (
                       <div className="mt-3 pt-3 border-t border-gray-600">
                         <button
                           onClick={() => handleCreateWorkflow(message.parsedWorkflow!, message.id)}
                           className="flex items-center gap-2 bg-[#a3e635] text-black px-3 py-1 rounded text-xs hover:bg-[#8bc329] transition-colors cursor-pointer"
                         >
                           <Plus className="w-3 h-3" />
                           Create Workflow
                         </button>
                       </div>
                     )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-[#424242] text-white">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-gray-400">Assistant is typing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* input */}
            <div className="flex items-center justify-between h-16 m-2 px-4 bg-[#424242] border border-[#4C4C4C] rounded-md">
              <form className="flex items-center gap-4 w-full" onSubmit={handleChatSend}>
                 <input
                   name="prompt"
                   className="w-full h-10 px-4 bg-transparent text-white disabled:opacity-50 disabled:cursor-not-allowed"
                   placeholder={
                     isLoading
                       ? "Processing..."
                       : "Ask anything, @ for content, / for commands"
                   }
                   disabled={isLoading}
                 />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="cursor-pointer bg-[#424242] hover:bg-[#515151] disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-3 rounded-md"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <SendHorizontal color="#fff" className="w-5 h-5"/>
                  )}
                </button>
              </form>
              <div className="flex items-center gap-2">
              </div>
            </div>
          </div>
        </div>
        <footer className="flex items-center justify-between h-8 px-2 bg-[#424242] border-t border-[#4C4C4C]">
        </footer>
      </main>
    </div>
  );
}
