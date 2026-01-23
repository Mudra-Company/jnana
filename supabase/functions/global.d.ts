// Deno global type declarations for edge functions
// These resolve TypeScript errors in the main project's type checker

declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
    serve(handler: (req: Request) => Promise<Response> | Response): void;
  };
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export * from "@supabase/supabase-js";
}

declare module "https://esm.sh/resend@2.0.0" {
  export class Resend {
    constructor(apiKey: string);
    emails: {
      send(options: {
        from: string;
        to: string[];
        subject: string;
        html: string;
      }): Promise<{ data?: { id: string }; error?: Error }>;
    };
  }
}

export {};
