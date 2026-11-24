// Formatage « extensible » des réponses HTTP : on pourra ajouter XML, CSV, YAML...
export interface ResponseStrategy {
  format(res: any, status: number, data: any): void;
}

abstract class AbstractResponseStrategy implements ResponseStrategy {
  protected abstract contentType(): string;
  protected abstract serialize(data: any): string;

  protected beforeSerialize(data: any): any {
    return data;
  }

  format(res: any, status: number, data: any): void {
    const prepared = this.beforeSerialize(data);
    res.status(status);
    res.setHeader("Content-Type", this.contentType());
    res.send(this.serialize(prepared));
  }
}

class JsonResponseStrategy extends AbstractResponseStrategy {
  protected contentType(): string {
    return "application/json; charset=utf-8";
  }
  protected serialize(data: any): string {
    return JSON.stringify(data);
  }
}

export class ResponseFormatterFactory {
  private static instance: ResponseFormatterFactory | null = null;
  private strategies: Map<string, ResponseStrategy> = new Map();

  private constructor() {
    this.register("json", new JsonResponseStrategy());
  }

  static getInstance(): ResponseFormatterFactory {
    if (ResponseFormatterFactory.instance === null) {
      ResponseFormatterFactory.instance = new ResponseFormatterFactory();
    }
    return ResponseFormatterFactory.instance;
  }

  register(name: string, strategy: ResponseStrategy): void {
    this.strategies.set(name, strategy);
  }

  getFormatter(name: string): ResponseStrategy {
    const strategy = this.strategies.get(name);
    if (!strategy) throw new Error("Formatter inconnu : " + name);
    return strategy;
  }
}
