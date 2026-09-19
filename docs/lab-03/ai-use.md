# AI Usage Report - Lab 3

## 1. LLMs Used

- **Antigravity (VS Code Agent):** Utilized for direct code implementation, testing, and debugging directly within the workspace context.
- **Gemini:** Utilized for high-level architectural planning, PR cross-review strategy, and step-by-step problem-solving.

## 2. Selected Key Prompts

The following prompts highlight the key interactions used to resolve complex implementation and testing challenges during this sprint:

1. **[Architecture/Spec]**
   > "Help me define the Lab 3 Authorization Matrix for Requester, IT Staff, and Administrator roles to include in specification.md."

2. **[Implementation]**
   > "Implement the missing API functions and UI handlers for Issue #32 (Staff Ticket Detail Workflows) and ensure complete cleanup of legacy backend code."

3. **[Code Verification]**
   > "Before I save and commit, please print out the EXACT code blocks you implemented for `updateStaffTicketStatus` and `handleClaim` to verify the try/catch logic."

4. **[Test Automation]**
   > "Based on the Lab 3 requirements, write a Playwright E2E script that automatically loops through Desktop, Tablet, and Mobile viewports to capture screenshots for all 4 main flows and saves them into the `artifacts/lab-03/screenshots/` directories."

5. **[Debugging E2E]**
   > "The Playwright script failed with 'Test timeout of 30000ms exceeded'. It is trying to find `text=Staff Queue` and `input[type='email']` which don't match my UI. Please update the locators to exactly match the frontend components."

6. **[Debugging Backend Tests]**
   > "My backend vitest run failed with 7 Auth errors. Rewrite `ticket-auth.test.ts` to mock and use Bearer Tokens instead of the old Lab 2 `X-Requester-Id` header, and fix the `bcrypt.compare` mock in `auth.api.test.ts` to resolve the 400 Bad Request error."

## 3. Reflection on AI Usage

### Strengths
The AI was incredibly powerful for automating repetitive and time-consuming tasks, such as writing the viewport-looping Playwright script for capturing automated screenshots across multiple flows. Furthermore, it proved highly effective at identifying deep technical debts and obscure bugs within the codebase—such as proactively discovering that `attachment.controller.ts` was still secretly relying on legacy Lab 2 `X-Requester-Id` headers instead of the newly implemented JWT authorization.

### Weaknesses & Lessons Learned
Despite its strengths, working with AI requires strict human oversight. At times, the agent attempted "lazy" string replacements or placeholder updates instead of writing out full, functional logic. This necessitated writing strict code verification prompts to inspect the exact implementations before committing. Additionally, it occasionally hallucinated UI selectors—such as guessing button names or input attributes in Playwright tests that didn't match the actual DOM. 

Ultimately, this experience reinforced that while AI is a fantastic co-pilot that massively accelerates development velocity, human contextual awareness, strict code review, and domain knowledge remain absolutely essential for a successful integration.
