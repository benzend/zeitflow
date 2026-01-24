import { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { ArrowLeft, SendHorizontal, Workflow as WorkflowIcon, Files, Plus, Loader2, MessageSquare, X, CheckCircle } from 'lucide-react';
import { Button } from "@/components/Button";
import { parseWorkflowFromText, ParsedWorkflow } from "@/lib/workflow-parser";
import { generateNodeId, generateFieldId } from "@/lib/workflow-utils";
import { marked } from 'marked';
import ChatHistorySkeleton from "@/components/ChatHistorySkeleton";

interface PlanProposal {
  title: string;
  description: string;
  steps: Array<{ action: string; rationale?: string }>;
}

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
  parsedWorkflow?: ParsedWorkflow;
  proposedPlan?: PlanProposal;
  proposedWorkflow?: ParsedWorkflow;
  planStatus?: 'pending' | 'approved' | 'rejected';
  workflowStatus?: 'pending' | 'approved' | 'rejected';
  createdWorkflowId?: number;
}

export default function WorkflowBuilderPage() {
  const { data: session, status } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState("");
  const [fetchingChatHistory, setFetchingChatHistory] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [sidePanel, setSidePanel] = useState<'workflows' | 'files' | 'chats'>('workflows');
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<number | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [creatingWorkflowIndex, setCreatingWorkflowIndex] = useState<number | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const openSidePanel = (panel: 'workflows' | 'files' | 'chats') => {
    setSidePanel(panel);
  }

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/workflows");
      const data = await response.json();

      if (data.success) {
        const sorted = (data.workflows || []).sort(
          (a: Workflow, b: Workflow) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setWorkflows(sorted);
      } else {
        setError(data.message || "Failed to fetch workflows");
      }
    } catch (err) {
      setError("An error occurred while fetching workflows");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

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

    setFetchingChatHistory(true);

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

    setFetchingChatHistory(false);
  }, [currentThreadId]);

  // Fetch messages when current thread changes
  useEffect(() => {
    if (currentThreadId) {
      fetchChatHistory(currentThreadId);
    } else {
      setChatHistory([]);
    }
  }, [currentThreadId, fetchChatHistory]);

  // Log chat events (plan and workflow approval/rejection)
  const logChatEvent = async (
    eventType: 'workflow_plan_approved' | 'workflow_plan_rejected' | 'workflow_approved' | 'workflow_rejected',
    data: { workflowId?: number; proposalData?: ParsedWorkflow | PlanProposal; metadata?: Record<string, unknown> }
  ) => {
    if (!currentThreadId) return;

    try {
      await fetch('/api/chat/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: currentThreadId,
          eventType,
          workflowId: data.workflowId,
          proposalData: data.proposalData,
          metadata: data.metadata,
        }),
      });
    } catch (error) {
      console.error('Failed to log chat event:', error);
    }
  };

  // Update message status in chat history
  const updateMessageStatus = (messageIndex: number, updates: Partial<ChatMessage>) => {
    setChatHistory(prev => prev.map((msg, idx) =>
      idx === messageIndex ? { ...msg, ...updates } : msg
    ));
  };

  // Approve and create workflow from inline proposal
  const handleApproveWorkflow = async (workflow: ParsedWorkflow, messageIndex: number) => {
    setCreatingWorkflowIndex(messageIndex);

    try {
      const createResponse = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workflow.name,
          description: workflow.description
        }),
      });

      const createData = await createResponse.json();
      if (!createData.success) {
        throw new Error(createData.message || 'Failed to create workflow');
      }

      const workflowId = createData.workflow.id;

      const saveResponse = await fetch(`/api/workflow/${workflowId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: workflow.nodes,
          connections: workflow.connections
        }),
      });

      const saveData = await saveResponse.json();
      if (!saveData.success) {
        throw new Error(saveData.message || 'Failed to save workflow');
      }

      await logChatEvent('workflow_approved', { workflowId, proposalData: workflow });
      updateMessageStatus(messageIndex, { workflowStatus: 'approved', createdWorkflowId: workflowId });
      await fetchWorkflows();

    } catch (error) {
      console.error('Workflow creation error:', error);
      alert('Failed to create workflow. Please try again.');
    } finally {
      setCreatingWorkflowIndex(null);
    }
  };

  const handleRejectWorkflow = async (workflow: ParsedWorkflow, messageIndex: number) => {
    await logChatEvent('workflow_rejected', { proposalData: workflow });
    updateMessageStatus(messageIndex, { workflowStatus: 'rejected' });
  };

  const systemPrompt = `You are an AI assistant that helps users create and manage workflows.

IMPORTANT - TWO-STEP WORKFLOW CREATION:
1. FIRST use propose_plan to outline the high-level plan:
   - What the workflow accomplishes
   - The sequential steps/stages

2. ONLY after the user approves the plan, use propose_workflow for concrete implementation.

Available tools:
- list_workflows - See existing workflows
- get_capabilities - Learn about available node types
- get_thread_events - Check conversation history (previous plans/rejections)
- propose_plan - Outline a high-level plan (use FIRST)
- propose_workflow - Propose concrete implementation (use AFTER plan approval)

If you see a 'workflow_plan_approved' event in thread events, proceed directly to propose_workflow.
If you see a 'workflow_plan_rejected' event, ask for feedback and propose a revised plan.

WORKFLOW STRUCTURE:
- Workflows consist of nodes connected in sequence
- Available node types: entry (forms), ai (AI processing), scheduler (calendar), review (human approval), slack, email, sms
- Use {{entry.fields.fieldName}} to reference form inputs in later nodes
- Use {{previousOutput}} to reference the output of the previous AI node

Be helpful, concise, and use tools proactively when the user's intent is clear.`;

  // Core message sending function
  const sendMessage = async (prompt: string, addToHistory: boolean = true) => {
    if (!prompt.trim()) return;

    // Add user message to history
    if (addToHistory) {
      const userMessage: ChatMessage = {
        role: 'user',
        content: prompt,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, userMessage]);
    }

    setIsLoading(true);
    setIsTyping(true);

    try {
      const apiResponse = await fetch('/api/chat/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: 'google/gemini-2.0-flash-001',
          systemPrompt,
          history: chatHistory,
          threadId: currentThreadId
        }),
      });

      const data = await apiResponse.json();

      if (data.success) {
        if (data.threadId && data.threadId !== currentThreadId) {
          setCurrentThreadId(data.threadId);
          await fetchChatThreads();
        }

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };

        if (data.proposedPlan) {
          assistantMessage.proposedPlan = data.proposedPlan;
          assistantMessage.planStatus = 'pending';
        }

        if (data.proposedWorkflow) {
          const proposed = data.proposedWorkflow;
          interface ProposedNode {
            type: 'entry' | 'ai' | 'scheduler' | 'review' | 'slack' | 'email' | 'sms';
            label?: string;
            fields?: Array<{ name: string; label?: string; type?: string; options?: string[] }>;
            aiConfig?: { systemPrompt: string; userPrompt?: string; model?: string; outputType?: string };
            schedulerConfig?: { people: string[]; minTimeRequirement: string; calendar?: string };
            emailConfig?: { to: string[]; subject?: string; message?: string };
            slackConfig?: { channel: string; message?: string };
            smsConfig?: { to: string[]; message?: string };
          }
          const nodeIds = proposed.nodes.map(() => generateNodeId());

          assistantMessage.proposedWorkflow = {
            name: proposed.name,
            description: proposed.description,
            nodes: proposed.nodes.map((node: ProposedNode, index: number) => ({
              id: nodeIds[index],
              type: node.type,
              label: node.label || `${node.type.charAt(0).toUpperCase() + node.type.slice(1)} Node`,
              x: 100,
              y: 100 + (index * 150),
              ...(node.fields && { fields: node.fields.map((f) => ({ id: generateFieldId(), key: f.name, name: f.name, type: f.type || 'text', label: f.label })) }),
              ...(node.aiConfig && { aiConfig: { ...node.aiConfig, outputStructure: '' } }),
              ...(node.schedulerConfig && { schedulerConfig: node.schedulerConfig }),
              ...(node.emailConfig && { emailConfig: node.emailConfig }),
              ...(node.slackConfig && { slackConfig: node.slackConfig }),
              ...(node.smsConfig && { smsConfig: node.smsConfig }),
            })),
            connections: proposed.nodes.slice(0, -1).map((_: ProposedNode, index: number) => ({
              from: nodeIds[index],
              to: nodeIds[index + 1],
            })),
          };
          assistantMessage.workflowStatus = 'pending';
        }

        setChatHistory(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.message || 'Chat failed');
      }
    } catch (error) {
      console.error('Chat error:', error);
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
  };

  const handleApprovePlan = async (plan: PlanProposal, messageIndex: number) => {
    await logChatEvent('workflow_plan_approved', { proposalData: plan });
    updateMessageStatus(messageIndex, { planStatus: 'approved' });
    // Trigger AI to propose the workflow
    await sendMessage('Plan approved. Please proceed with the workflow implementation.');
  };

  const handleRejectPlan = async (plan: PlanProposal, messageIndex: number) => {
    await logChatEvent('workflow_plan_rejected', { proposalData: plan });
    updateMessageStatus(messageIndex, { planStatus: 'rejected' });
    // Trigger AI to ask for feedback
    await sendMessage('Plan rejected. Please ask what changes I would like.');
  };

  const handleChatSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const promptInput = form.elements.namedItem('prompt') as HTMLInputElement;
    const prompt = promptInput.value;
    promptInput.value = '';
    await sendMessage(prompt);
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

  return (
    <div>
      <Head>
        <title>IWE - ZeitFlow</title>
        <meta name="description" content="Interactive Workflow Engine" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="bg-background bg-gradient-to-b from-surface to-surface-hover h-screen">
        <header className="flex items-center justify-between h-8 px-2 bg-surface border-b border-border">
          <Button href="/workflows" variant="tertiary" className="!bg-transparent !p-0">
            <ArrowLeft className="text-foreground hover:text-primary transition-colors p-1" />
          </Button>
        </header>
        <div className="h-[calc(100vh-4rem)] flex">
          {/* sidebar */}
          <div className="bg-surface border-r border-border h-full w-10 flex flex-col items-center justify-start gap-2 py-2">
            <Button onClick={() => openSidePanel('workflows')} variant="tertiary" className="!bg-surface hover:!bg-surface-hover !p-1">
              <WorkflowIcon className="text-foreground" />
            </Button>
            <Button onClick={() => openSidePanel('files')} variant="tertiary" className="!bg-surface hover:!bg-surface-hover !p-1">
              <Files className="text-foreground" />
            </Button>
            <Button onClick={() => openSidePanel('chats')} variant="tertiary" className="!bg-surface hover:!bg-surface-hover !p-1">
              <MessageSquare className="text-foreground" />
            </Button>
          </div>

          {/* navigation */}
          <div className="flex flex-col h-full bg-surface border-r border-border w-5/12">
            <nav className="flex h-8 bg-surface-hover">
              <button onClick={() => openSidePanel('workflows')} className={`px-4 cursor-pointer ${sidePanel === 'workflows' ? 'bg-surface text-foreground' : 'bg-surface-hover text-text-muted'}`}>Workflows</button>
              <button onClick={() => openSidePanel('files')} className={`px-4 cursor-pointer ${sidePanel === 'files' ? 'bg-surface text-foreground' : 'bg-surface-hover text-text-muted'}`}>Files</button>
              <button onClick={() => openSidePanel('chats')} className={`px-4 cursor-pointer ${sidePanel === 'chats' ? 'bg-surface text-foreground' : 'bg-surface-hover text-text-muted'}`}>Chats</button>
            </nav>

            <div className="flex flex-col gap-2 p-2 h-full overflow-y-auto">
              {sidePanel === 'workflows' && workflows.map((workflow, index) => (
                <Button href={`/workflow/${workflow.id}`}
                  key={index} variant="clear" className="!bg-surface !p-2 flex flex-col justify-start items-start h-24 border border-border rounded-md text-left">
                  <h1 className="text-foreground font-semibold text-lg truncate">{workflow.name}</h1>
                  <p className="text-sm text-text-muted truncate">{workflow.description || "Type to insert a description..."}</p>
                  <div className="flex items-center gap-2">
                    <div>
                      {workflow.executionCount}
                    </div>
                  </div>
                </Button>
              ))}

              {sidePanel === 'chats' && (
                <>
                  <Button
                    onClick={() => setCurrentThreadId(null)}
                    variant="primary"
                    className="w-28"
                    size="sm"
                  >
                    <Plus className="w-3 h-3" />
                    New Chat
                  </Button>
                  {chatThreads.map((thread, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentThreadId(thread.id)}
                      className={`flex flex-col justify-between h-18 text-left p-2 border rounded-md transition-colors cursor-pointer ${
                        currentThreadId === thread.id
                          ? 'bg-surface text-foreground border-primary'
                          : 'bg-surface text-foreground border-border hover:bg-surface-hover'
                      }`}
                    >
                      <h1 className="text-md truncate">{thread.title}</h1>
                      <p className="text-sm text-text-muted">
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
              {fetchingChatHistory ? (
                <ChatHistorySkeleton />
              ): currentThreadId && chatHistory.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-invert'
                      : 'bg-surface text-foreground'
                  }`}>
                    <div
                      className="text-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: marked(message.content, { breaks: true })
                      }}
                    />
                    <div className={`text-xs ${message.role === 'assistant' ? 'text-text-muted' : 'text-text-muted'}`}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>

                    {/* Inline Plan Proposal */}
                    {message.proposedPlan && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="text-sm font-semibold text-foreground mb-2">
                          {message.proposedPlan.title}
                        </div>
                        <div className="text-sm text-text-muted mb-3">
                          {message.proposedPlan.description}
                        </div>
                        <div className="space-y-1 mb-3">
                          {message.proposedPlan.steps.map((step, stepIndex) => (
                            <div key={stepIndex} className="text-sm text-foreground">
                              {stepIndex + 1}. {step.action}
                              {step.rationale && (
                                <span className="text-text-muted ml-1">— {step.rationale}</span>
                              )}
                            </div>
                          ))}
                        </div>
                        {message.planStatus === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApprovePlan(message.proposedPlan!, index)}
                              variant="primary"
                              size="sm"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleRejectPlan(message.proposedPlan!, index)}
                              variant="secondary"
                              size="sm"
                            >
                              <X className="w-3 h-3" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {message.planStatus === 'approved' && (
                          <div className="text-sm text-primary flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Plan approved
                          </div>
                        )}
                        {message.planStatus === 'rejected' && (
                          <div className="text-sm text-text-muted flex items-center gap-1">
                            <X className="w-3 h-3" /> Plan rejected
                          </div>
                        )}
                      </div>
                    )}

                    {/* Inline Workflow Proposal */}
                    {message.proposedWorkflow && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="text-sm font-semibold text-foreground mb-1">
                          {message.proposedWorkflow.name}
                        </div>
                        {message.proposedWorkflow.description && (
                          <div className="text-sm text-text-muted mb-2">
                            {message.proposedWorkflow.description}
                          </div>
                        )}
                        <div className="text-xs text-text-muted mb-3">
                          {message.proposedWorkflow.nodes.length} nodes: {message.proposedWorkflow.nodes.map(n => n.type).join(' → ')}
                        </div>
                        {message.workflowStatus === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApproveWorkflow(message.proposedWorkflow!, index)}
                              variant="primary"
                              size="sm"
                              disabled={creatingWorkflowIndex === index}
                            >
                              {creatingWorkflowIndex === index ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              {creatingWorkflowIndex === index ? 'Creating...' : 'Create Workflow'}
                            </Button>
                            <Button
                              onClick={() => handleRejectWorkflow(message.proposedWorkflow!, index)}
                              variant="secondary"
                              size="sm"
                              disabled={creatingWorkflowIndex === index}
                            >
                              <X className="w-3 h-3" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {message.workflowStatus === 'approved' && (
                          <div className="text-sm text-primary flex items-center gap-2">
                            <CheckCircle className="w-3 h-3" />
                            <span>Workflow created</span>
                            {message.createdWorkflowId && (
                              <Button
                                href={`/workflow/${message.createdWorkflowId}`}
                                variant="primary"
                                size="sm"
                              >
                                Open Workflow
                              </Button>
                            )}
                          </div>
                        )}
                        {message.workflowStatus === 'rejected' && (
                          <div className="text-sm text-text-muted flex items-center gap-1">
                            <X className="w-3 h-3" /> Workflow rejected
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-surface text-foreground">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-text-muted">Assistant is typing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* input */}
            <div className="flex items-center justify-between h-16 m-2 px-4 bg-surface border border-border rounded-md">
              <form className="flex items-center gap-4 w-full" onSubmit={handleChatSend}>
                 <input
                   name="prompt"
                   className="w-full h-10 px-4 bg-transparent text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="cursor-pointer bg-surface hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-3 rounded-md"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <SendHorizontal color="currentColor" className="w-5 h-5 text-foreground"/>
                  )}
                </button>
              </form>
              <div className="flex items-center gap-2">
              </div>
            </div>
          </div>
        </div>
        <footer className="flex items-center justify-between h-8 px-2 bg-surface border-t border-border">
        </footer>
      </main>
    </div>
  );
}
