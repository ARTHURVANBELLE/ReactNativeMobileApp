declare namespace NodeJS {
  interface RequireInterface {
    context(
      directory: string,
      useSubdirectories?: boolean,
      regExp?: RegExp
    ): any;
  }
}

interface NodeRequire extends NodeJS.RequireInterface {}
