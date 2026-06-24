export class GenerationTruncationError extends Error {
  public provider: string;
  public model: string;
  public finishReason: string;
  public promptSize: number;
  public completionSize: number;

  constructor(
    message: string,
    provider: string,
    model: string,
    finishReason: string,
    promptSize: number,
    completionSize: number
  ) {
    super(message);
    this.name = 'GenerationTruncationError';
    this.provider = provider;
    this.model = model;
    this.finishReason = finishReason;
    this.promptSize = promptSize;
    this.completionSize = completionSize;
  }
}
