export type WorkflowRequest = {
  method: string;
  headers: Record<string, string>;
  params: Record<string, string>;
  body: string;
};

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
 *   .then(async (req) => {
 *     // Do something with the request
 *     return { status: 200, body: "Hello, world!" };
 *   })
 *   .catchAll(async (error) => {
 *     // Handle any errors that occur during the workflow
 *     return { status: 500, body: "Internal server error" };
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
  private expectation: WorkflowExpectation;

  constructor(config: { endpoint: string, expectation?: WorkflowExpectation }) {
    this.endpoint = config.endpoint;
    this.expectation = config.expectation || {};
  }

  public then(fn: (req: WorkflowRequest) => Promise<WorkflowResponse | object>) {
    return fn();
  }

  public catchAll(fn: (error: Error) => Promise<WorkflowResponse>) {
    return fn();
  }
}
