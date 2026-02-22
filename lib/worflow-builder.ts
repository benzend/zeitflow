import { ok, err, Result } from 'neverthrow';

export type WorkflowRequest = {
  params: Record<string, string>;
  body: string;
};

export type WorkflowResponse = Record<string, unknown>;

/**
 * WorkflowBuilder
 *
 * This class is used to build a workflow. It is a fluent interface that allows
 * you to chain together multiple steps in a workflow.
 *
 * Example usage:
 *
 * ```ts
 * const workflow = WorkflowBuilder.endpoint("/api/endpoint")
 *   .andThen(async (req) => {
 *     // Do something with the request
 *     return Res.json({ status: 200, body: "Hello, world!" });
 *   })
 *   .catchAll(async (error) => {
 *     // Handle any errors that occur during the workflow
 *     return Res.json({ status: 500, body: "Internal server error" });
 *   });
 * ```
 */
export class WorkflowBuilder {
  public static endpoint(endpoint: string, expectation?: WorkflowExpectation) {
    return new Builder({ endpoint, expectation });
  }

  public static entry() {
    // TODO: Implement entry method
  }
}


export type EntryType = 'endpoint' | 'form' | 'manual' | 'cron' | 'webhook';

interface EntryConfig {
}

class ConfigureEntriesWorkflowBuilder {
  private _config: EntryConfig;
  private _entryBuilder: EntriesWorkflowBuilder;
  constructor(config: EntryConfig, entryBuilder: EntriesWorkflowBuilder) {
    this._config = config;
    this._entryBuilder = entryBuilder;
  }

  public configure(config: EntryConfig) {
    return this._entryBuilder;
  }
}

class EntriesWorkflowBuilder {
  private _config: EntryConfig = {};
  private entryType: EntryType = 'manual';
  private prevEntry: EntriesWorkflowBuilder | null = null;

  constructor(entryType: EntryType, opts?: { prevEntry?: EntriesWorkflowBuilder, config?: EntryConfig }) {
    this.entryType = entryType;
    if (opts?.prevEntry) this.prevEntry = opts.prevEntry;
    if (opts?.config) this._config = opts.config;
  }

  public addEntry(entryType: EntryType) {
    return new EntriesWorkflowBuilder(entryType);
  }

  public getHistory(): Array<EntriesWorkflowBuilder> {
    const history: EntriesWorkflowBuilder[] = [];
    let prev = this.prevEntry;
    while (prev) {
      history.push(prev);
      prev = prev.getPrevEntry();
    }
    return history;
  }

  // TODO - this needs to be private, somehow...
  public getPrevEntry(): EntriesWorkflowBuilder | null {
    return this.prevEntry;
  }

  public cloneWith(
    opts?: {
      entryType?: EntryType;
      prevEntry?: EntriesWorkflowBuilder | null;
    }): EntriesWorkflowBuilder {
    return new EntriesWorkflowBuilder(opts?.entryType || this.entryType, {
      prevEntry: opts?.prevEntry !== undefined ? (opts.prevEntry ?? undefined) : (this.prevEntry ?? undefined)
    });
  }
}

// Placeholder types for future implementation
type ExecutionState = 'pending' | 'running' | 'completed' | 'failed';
type Step = { id: string; type: string; config: Record<string, unknown> };

type Workflow = {
  goal: "Notify sales when a high-value Stripe payment succeeds";
  constraints: [
    "Must use Slack",
    "Do not email customers directly",
  ];
  state: ExecutionState;
  steps: Step[];
};

 type ToolSpec = {
  id: "send_email";
  description: "Send an email via SMTP or provider API";
  inputs: {
    to: "email";
    subject: "string";
    body: "string";
  };
  outputs: {
    messageId: "string";
  };
  sideEffects: true;
  auth: "smtp" | "oauth2";
};

export type WorkflowExpectation = {
  headers?: Record<string, string>;
  params?: Record<string, "boolean" | "number" | "string" | "object">;
};

class Builder {
  private endpoint: string;
  private prevResult: object | null = null;
  private expectation: WorkflowExpectation;
  private catchAllFn: ((error: Error) => Promise<WorkflowResponse>) | null = null;
  private headers: Record<string, string> = {};
  private params: Record<string, "boolean" | "number" | "string" | "object"> = {};

  constructor(config: { endpoint: string, expectation?: WorkflowExpectation }) {
    this.endpoint = config.endpoint;
    this.expectation = config.expectation || {};
  }

  public async andThen(fn: (req: WorkflowRequest) => Promise<WorkflowResponse | object>) {
    try {
      const result = await fn({ params: {}, body: '' });
      this.prevResult = result;
      return this;
    } catch (error) {
      const err = error as Error;
      // Call the catchAll function if set, otherwise rethrow
      if (this.catchAllFn) {
        await this.catchAllFn(err);
      } else {
        throw err;
      }
      return this;
    }
  }

  public catchAll(fn: (error: Error) => Promise<WorkflowResponse>) {
    this.catchAllFn = fn;
    return this;
  }
}

type SlackConfigType = {
  message: string;
  channel: string;
  botId: string;
}

// Placeholder types for SlackIntegration
type SlackMessageConfigType = SlackConfigType;
type SlackMessageResultsType = { success: boolean; error?: string };

class SlackIntegration {
  private config: SlackConfigType;

  constructor(config: SlackConfigType) {
    this.config = config;
  }

  public async execute(
    config: SlackMessageConfigType = this.getConfig(),
    variables?: Record<string, string>
  ): Promise<Result<SlackMessageResultsType, string>> {
    try {
      // TODO: Implement sendSlackMessage
      const results = { success: true } as SlackMessageResultsType & { success: boolean; error?: string };
      console.log('SlackIntegration.execute called with:', config, variables);
      if (results.success) {
        return ok(results);
      } else {
        return err(results.error || 'Failed to send slack message for some unknown reason');
      }
    } catch (e) {
      return err((e as Error).message);
    }
  }

  /**
  * @return {SlackConfigType} a reference to the current config
  */
  public getConfig(): SlackConfigType {
    return this.config;
  }

  /**
  * @return {SlackConfigType} a reference to the current config
  */
  public updateConfig(configData: Partial<SlackConfigType>): Result<SlackConfigType, string> {
    try {
      this.config = {
        ...this.config,
        ...configData,
      };
      return ok(this.config);
    } catch (e) {
      return err((e as Error).message);
    }
  }
}

    //   case 'slack':
    //     const slackConfig = config.slackConfig || {};
    //
    //     // Collect available variables from connected nodes
    //     const slackVariables = collectAvailableVariables(node.id, connections, nodes, inputData, outputData);
    //
    //     console.log(`Slack Node ${node.id} - Available variables:`, Object.keys(slackVariables));
    //     console.log(`Slack Node ${node.id} - Original message:`, slackConfig.message);
    //     console.log(`Slack Node ${node.id} - Original channel:`, slackConfig.channel);
    //
    //     // Substitute variables in message
    //     const slackMessage = slackConfig.message
    //       ? substituteVariables(slackConfig.message, slackVariables)
    //       : '';
    //
    //     // Substitute variables in channel
    //     const slackChannel = slackConfig.channel
    //       ? substituteVariables(slackConfig.channel, slackVariables)
    //       : '';
    //
    //     console.log(`Slack Node ${node.id} - Processed message:`, slackMessage);
    //     console.log(`Slack Node ${node.id} - Processed channel:`, slackChannel);
    //
    //     try {
    //       // Use specific bot from config if provided, otherwise find any bot for this user
    //       let botToUse;
    //
    //       if (slackConfig.botId) {
    //         const [specificBot] = await db
    //           .select()
    //           .from(slackBotsTable)
    //           .where(eq(slackBotsTable.id, slackConfig.botId))
    //           .limit(1);
    //
    //         if (!specificBot || specificBot.userId !== userId) {
    //           outputData[node.id] = { error: 'Specified Slack bot not found or unauthorized' };
    //           break;
    //         }
    //         botToUse = specificBot;
    //       } else {
    //         // Find any bot for this user
    //         const [userBot] = await db
    //           .select()
    //           .from(slackBotsTable)
    //           .where(eq(slackBotsTable.userId, userId))
    //           .limit(1);
    //
    //         if (!userBot) {
    //           outputData[node.id] = { error: 'No Slack bot configured for this user' };
    //           break;
    //         }
    //         botToUse = userBot;
    //       }
    //
    //       const slackResponse = await sendSlackMessage(
    //         { botId: botToUse.id, channel: slackChannel, message: slackMessage }
    //       );
    //
    //       if (!slackResponse.success) {
    //         outputData[node.id] = { error: slackResponse.error };
    //         console.error('Slack call error:', slackResponse.error);
    //         break;
    //       }
    //       outputData[node.id] = { success: true };
    //     } catch (error) {
    //       outputData[node.id] = { error: 'Failed to send Slack message' };
    //       console.error('Slack call error:', error);
    //     }
    //     break;
    //   case 'email':
    //     const emailConfig = config.emailConfig || {};
    //
    //     // Collect available variables from connected nodes
    //     const emailVariables = collectAvailableVariables(node.id, connections, nodes, inputData, outputData);
    //
    //     console.log(`Email Node ${node.id} - Available variables:`, Object.keys(emailVariables));
    //     console.log(`Email Node ${node.id} - Original message:`, emailConfig.message);
    //     console.log(`Email Node ${node.id} - Original subject:`, emailConfig.subject);
    //
    //     // Substitute variables in message
    //     const emailMessage = emailConfig.message
    //       ? substituteVariables(emailConfig.message, emailVariables)
    //       : '';
    //
    //     // Substitute variables in subject
    //     const emailSubject = emailConfig.subject
    //       ? substituteVariables(emailConfig.subject, emailVariables)
    //       : undefined;
    //
    //     // Substitute variables in from
    //     const emailFrom = emailConfig.from
    //       ? substituteVariables(emailConfig.from, emailVariables)
    //       : undefined;
    //
    //     // Substitute variables in recipients array
    //     const emailRecipients = emailConfig.to
    //       ? emailConfig.to.map((recipient: string) => substituteVariables(recipient, emailVariables))
    //       : [];
    //
    //     console.log(`Email Node ${node.id} - Processed message:`, emailMessage);
    //     console.log(`Email Node ${node.id} - Processed subject:`, emailSubject);
    //     console.log(`Email Node ${node.id} - Recipients:`, emailRecipients);
    //
    //     try {
    //       const emailResponse = await sendWorkflowEmail(
    //         {
    //           to: emailRecipients,
    //           subject: emailSubject,
    //           message: emailMessage,
    //           from: emailFrom
    //         }
    //       );
    //
    //       if (!emailResponse.success) {
    //         outputData[node.id] = { error: emailResponse.error };
    //         console.error('Email call error:', emailResponse.error);
    //         break;
    //       }
    //       outputData[node.id] = { success: true };
    //     } catch (error) {
    //       outputData[node.id] = { error: 'Failed to send email' };
    //       console.error('Email call error:', error);
    //     }
    //     break;
    //   case 'sms':
    //     const smsConfig = config.smsConfig || {};
    //
    //     // Collect available variables from connected nodes
    //     const smsVariables = collectAvailableVariables(node.id, connections, nodes, inputData, outputData);
    //
    //     console.log(`SMS Node ${node.id} - Available variables:`, Object.keys(smsVariables));
    //     console.log(`SMS Node ${node.id} - Original message:`, smsConfig.message);
    //
    //     // Substitute variables in message
    //     const smsMessage = smsConfig.message
    //       ? substituteVariables(smsConfig.message, smsVariables)
    //       : '';
    //
    //     // Substitute variables in recipients array
    //     const smsRecipients = smsConfig.to
    //       ? smsConfig.to.map((recipient: string) => substituteVariables(recipient, smsVariables))
    //       : [];
    //
    //     console.log(`SMS Node ${node.id} - Processed message:`, smsMessage);
    //     console.log(`SMS Node ${node.id} - Recipients:`, smsRecipients);
    //
    //     try {
    //       const smsResponse = await sendWorkflowSMS(
    //         {
    //           to: smsRecipients,
    //           message: smsMessage
    //         }
    //       );
    //
    //       if (!smsResponse.success) {
    //         outputData[node.id] = { error: smsResponse.error };
    //         console.error('SMS call error:', smsResponse.error);
    //         break;
    //       }
    //       outputData[node.id] = { success: true };
    //     } catch (error) {
    //       outputData[node.id] = { error: 'Failed to send SMS' };
    //       console.error('SMS call error:', error);
    //     }
    //     break;
    // }

