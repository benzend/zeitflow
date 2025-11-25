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
}

export type WorkflowExpectation = {
  headers?: Record<string, string>;
  params?: Record<string, "boolean" | "number" | "string" | "object">;
};

class Builder {
  private endpoint: string;
  private prevResult: object | null = null;
  private expectation: WorkflowExpectation;
  private catchAllFn: (error: Error) => Promise<WorkflowResponse>;
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
      this.catchAllFn = this.catchAll.bind(this, err);
      return this;
    }
  }

  public catchAll(fn: (error: Error) => Promise<WorkflowResponse>) {
    this.catchAllFn = fn;
    return this;
  }
}
