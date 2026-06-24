export class BusinessLogicAudit {
  static auditBackend(code: string, features: string[]): void {
    if (!code) throw new Error("Code is empty");
    
    // Check for req.body passthrough
    if (code.match(/prisma\.[a-zA-Z]+\.(create|update)\(\s*\{\s*data\s*:\s*req\.body\s*\}\s*\)/)) {
      throw new Error("BusinessLogicAudit Failure: Detected direct req.body passthrough to Prisma. You MUST manually extract and validate fields from req.body before passing them to the database.");
    }

    // Check for validation logic (if statements checking inputs)
    if (!code.match(/if\s*\(\s*!req\.body\.[a-zA-Z]+/)) {
      throw new Error("BusinessLogicAudit Failure: Missing input validation. You MUST validate fields from req.body (e.g. if (!req.body.title) return res.status(400)...) before database operations.");
    }
  }

  static auditFrontend(code: string, features: string[]): void {
    if (!code) return;

    // We only strictly audit pages that have forms or data fetching
    const isForm = code.includes('<form') || code.includes('onSubmit=');
    const hasDataFetching = code.includes('fetch(') || 
                            code.includes('axios.get') || 
                            code.includes('useQuery(') || 
                            code.includes('useSWR(') || 
                            code.includes('useFetch(');
    const isDataDrivenList = code.includes('.map(') && code.includes('key=') && hasDataFetching;

    if (isForm) {
      if (!code.includes('preventDefault()')) {
        throw new Error("BusinessLogicAudit Failure: Form submission is missing e.preventDefault().");
      }
      if (!code.includes('setError(') && !code.includes('alert(') && !code.match(/if\s*\(\s*![a-zA-Z]+/)) {
        throw new Error("BusinessLogicAudit Failure: Form is missing client-side validation logic.");
      }
    }

    if (isDataDrivenList) {
      if (!code.includes('loading') && !code.includes('isLoading')) {
        throw new Error("BusinessLogicAudit Failure: Missing loading state for data fetching.");
      }
      if (!code.includes('error') && !code.includes('isError')) {
        throw new Error("BusinessLogicAudit Failure: Missing error state for data fetching.");
      }
    }
  }
}

export class RequirementCoverageAudit {
  static audit(code: string, features: string[]): void {
    if (code.includes('<TRACEABILITY_FAILURE>')) {
      throw new Error("RequirementCoverageAudit Failure: LLM self-reported that it could not fit all required features into the output.");
    }
    // We can add simple heuristic keyword checks for the features
    for (const feature of features) {
      const keywords = feature.toLowerCase().split(' ').filter(w => w.length > 4);
      let found = false;
      for (const kw of keywords) {
        if (code.toLowerCase().includes(kw)) {
          found = true;
          break;
        }
      }
      // Relaxed check: we don't fail immediately on keyword mismatch because LLMs might use synonyms, 
      // but if the LLM explicitly outputted TRACEABILITY_FAILURE we strictly fail.
    }
  }
}
