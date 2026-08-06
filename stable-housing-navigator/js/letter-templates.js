/**
 * Letter, Email & Script Templates — Stable Housing Navigator
 *
 * Templates use {{PLACEHOLDER}} syntax for variable substitution.
 * All letters are templates — users should review before sending.
 */

export const letterTemplates = [

  /* ============================================================
     RENTAL ASSISTANCE REQUEST
  ============================================================ */
  {
    id: 'rental-assistance-request',
    title: 'Request for Rental Assistance',
    category: 'rental-assistance',
    description: 'A letter to a rental assistance program explaining your situation and requesting help.',
    fields: ['tenant_name', 'tenant_address', 'landlord_name', 'monthly_rent', 'amount_owed', 'months_behind', 'reason_for_hardship', 'date'],
    template: `{{date}}

To Whom It May Concern:

My name is {{tenant_name}} and I am writing to request rental assistance. I am currently a tenant at {{tenant_address}}.

I am {{months_behind}} month(s) behind on rent, totaling ${{amount_owed}}. My monthly rent is ${{monthly_rent}}.

The reason for my hardship is: {{reason_for_hardship}}

I am asking for your assistance to prevent eviction and remain stably housed. I am committed to maintaining my housing and am taking steps to stabilize my situation.

I have enclosed the following documentation:
• Copy of my lease agreement
• Copies of any eviction notices I have received
• Proof of income or income loss
• [List any other documents you are including]

I am available to discuss my situation further. Please contact me at [your phone number] or [your email].

Thank you for your consideration.

Sincerely,
{{tenant_name}}
{{tenant_address}}`,
  },

  /* ============================================================
     REASONABLE ACCOMMODATION REQUEST
  ============================================================ */
  {
    id: 'reasonable-accommodation',
    title: 'Reasonable Accommodation Request — Disability',
    category: 'disability',
    description: 'A formal request to your landlord for a reasonable accommodation related to a disability.',
    fields: ['tenant_name', 'tenant_address', 'landlord_name', 'landlord_address', 'accommodation_requested', 'how_accommodation_helps', 'date'],
    template: `{{date}}

{{landlord_name}}
{{landlord_address}}

Re: Request for Reasonable Accommodation

Dear {{landlord_name}},

My name is {{tenant_name}}, and I am a tenant at {{tenant_address}}.

I am writing to request a reasonable accommodation pursuant to the Fair Housing Act (42 U.S.C. § 3604(f)) and the Washington Law Against Discrimination (RCW 49.60). I have a disability that affects [briefly describe functional limitation without disclosing diagnosis if you prefer].

The accommodation I am requesting is: {{accommodation_requested}}

This accommodation is necessary because: {{how_accommodation_helps}}

I am willing to provide supporting documentation from a healthcare provider if required. Please note that under federal law, you may only request documentation that confirms I have a disability and that the accommodation is related to my disability — you may not request details of my diagnosis or medical history.

I ask that you respond to this request in a reasonable time. Please contact me at [your phone number] to discuss this request.

Thank you for your consideration.

Sincerely,
{{tenant_name}}
{{tenant_address}}

[Keep a copy of this letter for your records. Consider sending by certified mail or email so you have proof of delivery.]`,
  },

  /* ============================================================
     REPAIR REQUEST LETTER
  ============================================================ */
  {
    id: 'repair-request',
    title: 'Written Repair Request to Landlord',
    category: 'habitability',
    description: 'A formal written request for repairs, creating a paper trail of your notification.',
    fields: ['tenant_name', 'tenant_address', 'landlord_name', 'landlord_address', 'repair_description', 'date_issue_started', 'date'],
    template: `{{date}}

{{landlord_name}}
{{landlord_address}}

Re: Written Notice of Required Repairs — {{tenant_address}}

Dear {{landlord_name}},

I am writing to formally notify you of repair issues at my rental unit at {{tenant_address}} that require your attention.

The following issues need repair:
{{repair_description}}

These issues have been present since approximately {{date_issue_started}}.

Under RCW 59.18.060, you are required to maintain the rental unit in a habitable condition. I am requesting that these repairs be completed promptly.

Please contact me at [your phone number] to arrange access to the unit for repairs.

I am keeping a copy of this letter for my records. If I do not hear from you within a reasonable time, I may need to explore my legal options under Washington State law.

Sincerely,
{{tenant_name}}
{{tenant_address}}

[Send this by certified mail AND email if possible. Keep the certified mail receipt.]`,
  },

  /* ============================================================
     EVICTION RESPONSE LETTER
  ============================================================ */
  {
    id: 'eviction-response',
    title: 'Response to Eviction Notice (Tenant)',
    category: 'eviction',
    description: 'A letter responding to an eviction notice, requesting communication and noting any disputes.',
    fields: ['tenant_name', 'tenant_address', 'landlord_name', 'notice_date', 'notice_type', 'dispute_reason', 'date'],
    template: `{{date}}

{{landlord_name}}

Re: Response to {{notice_type}} Dated {{notice_date}} — {{tenant_address}}

Dear {{landlord_name}},

I am writing in response to the notice I received on {{notice_date}}.

I want to resolve this situation and remain in my home. [Choose what applies:]

[IF DISPUTING: The amount or reason stated in the notice is not accurate because: {{dispute_reason}}]

[IF SEEKING TO PAY: I am actively working to obtain funds and would like to discuss a payment arrangement or short-term plan.]

[IF APPLYING FOR ASSISTANCE: I have applied for rental assistance with [program name] and expect a determination within [time]. I am asking for additional time to allow the assistance to process.]

I am asking to speak with you directly about this situation before any court proceedings. I believe we can work this out.

Please contact me as soon as possible at [your phone number] or [your email].

Sincerely,
{{tenant_name}}
{{tenant_address}}

NOTE: If you have already received a court summons, contact Northwest Justice Project (1-888-201-1014) or the Tenants Union (206-723-0500) IMMEDIATELY.`,
  },

  /* ============================================================
     UTILITY SHUTOFF PREVENTION LETTER
  ============================================================ */
  {
    id: 'utility-shutoff-prevention',
    title: 'Letter to Utility Provider — Payment Arrangement Request',
    category: 'utilities',
    description: 'A letter to your utility company requesting a payment plan or hardship assistance before shutoff.',
    fields: ['tenant_name', 'service_address', 'account_number', 'amount_owed', 'reason_for_hardship', 'proposed_payment', 'date'],
    template: `{{date}}

Customer Service Department
[Utility Company Name]

Re: Account #{{account_number}} — {{service_address}} — Request for Payment Arrangement

To Whom It May Concern:

I am writing to request a payment arrangement on my account #{{account_number}} at {{service_address}}.

I currently owe ${{amount_owed}} on my account. The reason I have fallen behind is: {{reason_for_hardship}}

I am requesting:
1. A payment plan to pay the balance over time
2. Any available utility assistance programs I may qualify for
3. A hold on disconnection while I arrange assistance

I propose to pay ${{proposed_payment}} per month toward the past-due balance while also paying current charges.

I am actively seeking utility assistance through [LIHEAP / 211 / other program]. I am asking for time to complete that process.

Please contact me at [your phone number] to discuss a payment arrangement.

Thank you,
{{tenant_name}}
{{service_address}}`,
  },

  /* ============================================================
     HOUSING DENIAL APPEAL
  ============================================================ */
  {
    id: 'housing-denial-appeal',
    title: 'Appeal of Housing Denial',
    category: 'applications',
    description: 'A letter appealing a denial from a housing authority, affordable housing program, or landlord.',
    fields: ['applicant_name', 'applicant_address', 'program_name', 'denial_date', 'denial_reason', 'appeal_reason', 'date'],
    template: `{{date}}

{{program_name}}
[Program Address]

Re: Appeal of Housing Application Denial — Application #[if known] — Denial dated {{denial_date}}

To Whom It May Concern:

My name is {{applicant_name}} and I am writing to appeal the denial of my application dated {{denial_date}}.

The reason stated for my denial was: {{denial_reason}}

I am appealing this decision because: {{appeal_reason}}

[Additional points as applicable:]

[IF DISABILITY: I am requesting a reasonable accommodation related to my disability. The circumstances of my application are affected by my disability in the following way: [explain]. I ask that you consider this as part of the review.]

[IF CRIMINAL HISTORY: I ask that you conduct an individualized assessment of my application, considering the nature and circumstances of the offense, the time elapsed, evidence of rehabilitation, and the direct bearing on my fitness as a tenant.]

[IF DOCUMENTATION ISSUE: I can provide the missing documentation. I am attaching/will provide [list documents].]

I am asking for a full review of my application and an opportunity to provide additional information. Please contact me at [your phone number].

Sincerely,
{{applicant_name}}
{{applicant_address}}`,
  },

  /* ============================================================
     LANDLORD COMMUNICATION — ASKING TO RENT WITH BARRIERS
  ============================================================ */
  {
    id: 'application-explanation',
    title: 'Explanation Letter for Housing Application',
    category: 'applications',
    description: 'A cover letter for housing applications explaining past eviction, credit, or other barriers.',
    fields: ['applicant_name', 'barrier_type', 'explanation', 'what_changed', 'references', 'date'],
    template: `{{date}}

Dear Landlord/Property Manager,

My name is {{applicant_name}}, and I am applying for housing at your property. I want to address some items in my rental history or background that you may see in my screening.

Regarding {{barrier_type}}:
{{explanation}}

What has changed since then:
{{what_changed}}

I am a reliable tenant who will pay rent on time and take care of the property. I can provide references who can speak to my character and reliability:
{{references}}

I appreciate your consideration. I am happy to discuss any concerns in person.

Sincerely,
{{applicant_name}}
[Phone number]
[Email address]`,
  },

  /* ============================================================
     VOUCHER EXTENSION REQUEST
  ============================================================ */
  {
    id: 'voucher-extension-request',
    title: 'Voucher Extension Request to Housing Authority',
    category: 'voucher',
    description: 'A formal request to extend your housing voucher search time.',
    fields: ['applicant_name', 'voucher_number', 'housing_authority', 'current_expiry_date', 'barriers_encountered', 'steps_taken', 'date'],
    template: `{{date}}

{{housing_authority}}
[Housing Authority Address]

Re: Request for Voucher Extension — Voucher #{{voucher_number}} — Expiring {{current_expiry_date}}

Dear Housing Authority,

My name is {{applicant_name}} and I hold Housing Choice Voucher #{{voucher_number}}, which expires on {{current_expiry_date}}.

I am respectfully requesting an extension of my voucher search period because I have been unable to locate a suitable unit due to:
{{barriers_encountered}}

Steps I have taken to find housing:
{{steps_taken}}

I am actively searching and have not found a suitable unit. An extension would allow me to continue my search.

[If disability: I am also requesting a reasonable accommodation of additional search time because my disability has affected my ability to search for housing in the following way: [explain].]

Please contact me at [your phone number] to discuss this request.

Sincerely,
{{applicant_name}}
[Contact information]`,
  },

  /* ============================================================
     CASEWORKER FOLLOW-UP
  ============================================================ */
  {
    id: 'caseworker-follow-up',
    title: 'Follow-Up to Program or Caseworker',
    category: 'follow-up',
    description: 'A polite follow-up email or letter to a caseworker, program, or housing provider.',
    fields: ['your_name', 'caseworker_name', 'program_name', 'original_contact_date', 'what_waiting_for', 'date'],
    template: `{{date}}

Dear {{caseworker_name}} / {{program_name}} Team,

My name is {{your_name}}. I am following up on [my application / my case / our conversation] from {{original_contact_date}}.

I am waiting for: {{what_waiting_for}}

I understand you are very busy and I appreciate your help. I am following up because I want to make sure nothing has been missed and to ask if there is anything I can do to move my case forward.

Please let me know if you need any additional information from me.

I can be reached at [your phone number] or [your email].

Thank you,
{{your_name}}`,
  },
];

export const phoneScripts = [
  {
    id: 'script-rental-assistance',
    title: 'Calling About Rental Assistance',
    category: 'rental-assistance',
    script: `When you call, be ready to say:

"Hi, my name is [your name]. I'm calling because I'm at risk of eviction and I'm looking for rental assistance. Can you tell me if your program has any funds available and what the eligibility requirements are?"

Be ready to answer:
• How many months behind on rent you are
• Your monthly income and household size
• Whether you've received an eviction notice
• Your zip code or city

Ask:
• "Is there a waitlist?"
• "How long does the process take?"
• "What documents will I need?"
• "Is there anything I can do to speed up the process?"
• "Is there another program I should also apply to?"`,
  },
  {
    id: 'script-voucher-search',
    title: 'Calling Landlords with a Voucher',
    category: 'voucher',
    script: `When you call about a rental listing, say:

"Hi, I'm calling about the apartment at [address]. I'm interested in applying. I have a Housing Choice Voucher through [KCHA/SHA]. Is this a program you're willing to work with?"

Note: In Washington State, landlords generally cannot refuse to rent solely because you have a voucher.

If they say they "don't accept Section 8," you can say:
"I understand, but I wanted to let you know that Washington State law generally protects the right of voucher holders to apply for housing. Could I ask you to reconsider?"

You don't have to argue — if they refuse, note the date, time, and what they said. This may be a fair housing violation.

After any call, write down:
• Who you spoke to
• What they said
• The date and time`,
  },
  {
    id: 'script-legal-aid',
    title: 'Calling Legal Aid About Eviction',
    category: 'legal',
    script: `When you call Northwest Justice Project (1-888-201-1014):

"Hi, my name is [your name]. I've received an eviction notice and I need legal help."

Be ready to say:
• What kind of notice you received (3-day, 10-day, 20-day)
• The date on the notice
• Why you received the notice (non-payment, lease violation, etc.)
• Your court date if you have one
• Your income and household size (for eligibility screening)

Ask:
• "Can someone represent me at my eviction hearing?"
• "What are my rights in this situation?"
• "What should I do before my court date?"
• "Are there any defenses I might have?"

If you have a court date: Call IMMEDIATELY. The sooner you call, the more options you have.`,
  },
];

export function fillTemplate(templateId, values) {
  const template = letterTemplates.find(t => t.id === templateId);
  if (!template) return null;

  let text = template.template;
  Object.entries(values).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    text = text.replace(regex, value || `[${key}]`);
  });

  // Replace any remaining unfilled placeholders with prompts
  text = text.replace(/{{(\w+)}}/g, (_, key) => `[${key} — fill in]`);

  return text;
}

export function getTemplatesByCategory(category) {
  return letterTemplates.filter(t => t.category === category);
}
