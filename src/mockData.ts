import type { AnalysisResult } from './types';

export interface PresetDoc {
  name: string;
  category: string;
  icon: string;
  rawText: string;
  defaultAnalysis: AnalysisResult;
}

const MANDATORY_DISCLAIMER = "T&C Decoder provides automated AI-generated summaries for informational purposes only. This report does not constitute professional legal advice. Always consult a qualified legal professional for specific legal concerns.";

export const PRESET_DOCUMENTS: PresetDoc[] = [
  {
    name: "Zoom Video Communications",
    category: "Software & Video",
    icon: "Video",
    rawText: `ZOOM TERMS OF SERVICE

1. LICENSE AND RESTRICTIONS. Zoom hereby grants you a non-exclusive, non-transferable, revocable license to use the Services. You shall not modify, distribute, or reverse engineer any part of the Services.

2. TELEMETRY AND USER DATA LICENSE. You agree that Zoom may collect, compile, and analyze telemetry, usage data, and related information, including session logs, metadata, and communications details, to improve, develop, and maintain the Services. You grant Zoom a perpetual, worldwide, royalty-free, sublicensable, and transferable license to use, reproduce, and create derivative works of your telemetry and uploaded content for marketing and machine learning training purposes, except where prohibited by applicable law.

3. AUTOMATIC SUBSCRIPTION RENEWAL. All paid subscriptions to the Services shall automatically renew at the end of each billing period (e.g., monthly or annually) at the then-current subscription rate. To prevent automatic renewal, you must cancel your subscription at least thirty (30) days prior to the renewal date via the account dashboard. Cancellations received less than 30 days prior will apply to the subsequent billing cycle, and no refunds shall be issued for the current period.

4. MANDATORY ARBITRATION AND CLASS ACTION WAIVER. YOU AND ZOOM AGREE TO RESOLVE ANY AND ALL DISPUTES EXCLUSIVELY THROUGH INDIVIDUAL BINDING ARBITRATION, AND NOT IN A COURT OF LAW. YOU HEREBY WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT, CLASS-WIDE ARBITRATION, OR REPRESENTATIVE ACTIONS. DISPUTES WILL BE ARBITRATED UNDER THE CONSUMER RULES OF THE AMERICAN ARBITRATION ASSOCIATION.

5. LIMITATION OF LIABILITY AND DISCLAIMER OF WARRANTIES. THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE." ZOOM DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED. IN NO EVENT SHALL ZOOM'S TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS EXCEED THE TOTAL AMOUNT ACTUALLY PAID BY YOU TO ZOOM IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.`,
    defaultAnalysis: {
      provider_title: "Zoom Video Communications",
      domain_category: "Software & SaaS",
      overall_rating: "Be Careful",
      risk_rating_label: "Be Careful",
      estimated_read_time_minutes: 2,
      word_count: 284,
      raw_document_text: `ZOOM TERMS OF SERVICE...`,
      quick_matrix: {
        sells_or_monetizes_data: true,
        mandatory_arbitration: true,
        waives_class_action: true,
        auto_renewal_charges: true,
        easy_account_deletion: false
      },
      executive_summary: "Zoom's terms are standard for video conferencing, but contain three key provisions requiring user attention. First, Zoom reserves permission to analyze telemetry and session content for machine learning training. Second, all legal disputes must be settled through binding private arbitration with a full class action waiver. Third, paid subscriptions auto-renew on a strict 30-day advance notice requirement.",
      document_summary: "Zoom's terms are standard for video conferencing, but contain three key provisions requiring user attention. First, Zoom reserves permission to analyze telemetry and session content for machine learning training. Second, all legal disputes must be settled through binding private arbitration with a full class action waiver. Third, paid subscriptions auto-renew on a strict 30-day advance notice requirement.",
      analyzed_clauses: [
        {
          clause_id: 1,
          clause_title: "AI Training & Telemetry Usage",
          risk_level: "High Risk",
          overall_clause_assessment: "High Risk",
          // Canonical required fields
          exact_original_wording: "You grant Zoom a perpetual, worldwide, royalty-free, sublicensable, and transferable license to use, reproduce, and create derivative works of your telemetry and uploaded content for marketing and machine learning training purposes",
          trigger_words: ["perpetual", "royalty-free", "machine learning training purposes"],
          plain_english_summary: "Zoom can collect session data, logs, and uploaded content to train its machine learning and AI models without compensating you.",
          interpretation_rationale: "The legal text explicitly uses the terms 'perpetual, worldwide, royalty-free license' and specifies 'machine learning training purposes', which grants ongoing rights to use user telemetry for AI model development.",
          recommendation: "Review Zoom's account privacy settings after signing up and toggle off optional telemetry and AI feature data sharing.",
          recommendation_rationale: "Background telemetry collection is turned on by default, so actively checking your privacy dashboard is the only way to restrict AI data collection.",
          user_impact: "Your session interactions, metadata, and usage patterns can be incorporated into commercial AI training pipelines indefinitely.",
          // Legacy alias fields (kept for backwards compatibility with saved docs)
          exact_verbatim_quote: "You grant Zoom a perpetual, worldwide, royalty-free, sublicensable, and transferable license to use, reproduce, and create derivative works of your telemetry and uploaded content for marketing and machine learning training purposes",
          highlighted_evidence: "perpetual, worldwide, royalty-free... machine learning training purposes",
          plain_english_translation: "Zoom can collect session data, logs, and uploaded content to train its machine learning and AI models without compensating you.",
          why_ai_summarized: "The legal text explicitly uses the terms 'perpetual, worldwide, royalty-free license' and specifies 'machine learning training purposes', which grants ongoing rights to use user telemetry for AI model development.",
          potential_user_impact: "Your session interactions, metadata, and usage patterns can be incorporated into commercial AI training pipelines indefinitely.",
          why_recommended: "Background telemetry collection is turned on by default, so actively checking your privacy dashboard is the only way to restrict AI data collection."
        },
        {
          clause_id: 2,
          clause_title: "Mandatory Arbitration & Class Action Waiver",
          risk_level: "High Risk",
          overall_clause_assessment: "High Risk",
          exact_original_wording: "YOU AND ZOOM AGREE TO RESOLVE ANY AND ALL DISPUTES EXCLUSIVELY THROUGH INDIVIDUAL BINDING ARBITRATION, AND NOT IN A COURT OF LAW. YOU HEREBY WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT",
          trigger_words: ["INDIVIDUAL BINDING ARBITRATION", "WAIVE ANY RIGHT", "CLASS ACTION LAWSUIT"],
          plain_english_summary: "If a dispute arises, you cannot sue Zoom in court or join with other users in a class action lawsuit.",
          interpretation_rationale: "The phrase 'INDIVIDUAL BINDING ARBITRATION' combined with 'WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION' legally bars users from court litigation.",
          recommendation: "Check Zoom's Help Center to see if they offer a written 30-day arbitration opt-out letter address.",
          recommendation_rationale: "Some legal jurisdictions enforce arbitration unless a formal opt-out notice is submitted within the first month of opening an account.",
          user_impact: "If a major security breach or unfair billing dispute occurs, you must pay for individual arbitration rather than joining a unified group lawsuit.",
          exact_verbatim_quote: "YOU AND ZOOM AGREE TO RESOLVE ANY AND ALL DISPUTES EXCLUSIVELY THROUGH INDIVIDUAL BINDING ARBITRATION, AND NOT IN A COURT OF LAW. YOU HEREBY WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT",
          highlighted_evidence: "EXCLUSIVE INDIVIDUAL BINDING ARBITRATION... WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT",
          plain_english_translation: "If a dispute arises, you cannot sue Zoom in court or join with other users in a class action lawsuit.",
          why_ai_summarized: "The phrase 'INDIVIDUAL BINDING ARBITRATION' combined with 'WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION' legally bars users from court litigation.",
          potential_user_impact: "If a major security breach or unfair billing dispute occurs, you must pay for individual arbitration rather than joining a unified group lawsuit.",
          why_recommended: "Some legal jurisdictions enforce arbitration unless a formal opt-out notice is submitted within the first month of opening an account."
        },
        {
          clause_id: 3,
          clause_title: "Automatic Subscription Renewal & 30-Day Notice",
          risk_level: "Needs Attention",
          overall_clause_assessment: "Needs Attention",
          exact_original_wording: "All paid subscriptions to the Services shall automatically renew at the end of each billing period... To prevent automatic renewal, you must cancel your subscription at least thirty (30) days prior to the renewal date",
          trigger_words: ["automatically renew", "thirty (30) days prior", "no refunds"],
          plain_english_summary: "Paid accounts renew automatically, and cancellation requests must be submitted at least 30 days before your renewal date.",
          interpretation_rationale: "The clause mandates recurring billing charges and sets a strict 30-day advance deadline to avoid being billed for the next cycle.",
          recommendation: "Set a calendar reminder 35 days prior to your subscription renewal date so you have time to decide whether to continue.",
          recommendation_rationale: "The strict 30-day notice window means late cancellations trigger unrefundable charges.",
          user_impact: "If you cancel 25 days before renewal, you will still be charged for another full billing cycle without a refund.",
          exact_verbatim_quote: "All paid subscriptions to the Services shall automatically renew at the end of each billing period... To prevent automatic renewal, you must cancel your subscription at least thirty (30) days prior to the renewal date",
          highlighted_evidence: "automatically renew... cancel your subscription at least thirty (30) days prior to the renewal date",
          plain_english_translation: "Paid accounts renew automatically, and cancellation requests must be submitted at least 30 days before your renewal date.",
          why_ai_summarized: "The clause mandates recurring billing charges and sets a strict 30-day advance deadline to avoid being billed for the next cycle.",
          potential_user_impact: "If you cancel 25 days before renewal, you will still be charged for another full billing cycle without a refund.",
          why_recommended: "The strict 30-day notice window means late cancellations trigger unrefundable charges."
        },
        {
          clause_id: 4,
          clause_title: "Personal Non-Transferable License",
          risk_level: "Low Risk",
          overall_clause_assessment: "User Friendly",
          exact_original_wording: "Zoom hereby grants you a non-exclusive, non-transferable, revocable license to use the Services.",
          trigger_words: ["non-exclusive", "non-transferable", "revocable license"],
          plain_english_summary: "Zoom grants you standard personal permission to access and use the platform for video calls.",
          interpretation_rationale: "This is standard contractual authorization establishing your legal access rights without imposing extra liabilities.",
          recommendation: "No action required. Maintain standard account credential security.",
          recommendation_rationale: "This clause reflects standard operational licensing terms without hidden restrictions.",
          user_impact: "You are granted clear legal authorization to use the video software for your personal or workplace communication.",
          exact_verbatim_quote: "Zoom hereby grants you a non-exclusive, non-transferable, revocable license to use the Services.",
          highlighted_evidence: "non-exclusive, non-transferable... license to use the Services",
          plain_english_translation: "Zoom grants you standard personal permission to access and use the platform for video calls.",
          why_ai_summarized: "This is standard contractual authorization establishing your legal access rights without imposing extra liabilities.",
          potential_user_impact: "You are granted clear legal authorization to use the video software for your personal or workplace communication.",
          why_recommended: "This clause reflects standard operational licensing terms without hidden restrictions."
        }
      ],
      actionable_suggestions: [
        {
          suggestion: "Review Zoom's account privacy settings after signing up and toggle off optional telemetry and AI feature data sharing.",
          reason: "Because this agreement grants Zoom a perpetual license to use session telemetry for machine learning training."
        },
        {
          suggestion: "Set a calendar reminder 35 days before your billing renewal date to evaluate whether you wish to continue your paid subscription.",
          reason: "Because Zoom requires cancellations to be submitted at least 30 days in advance to prevent automatic renewal charges."
        },
        {
          suggestion: "Check if Zoom permits a written arbitration opt-out letter within 30 days of account creation.",
          reason: "Because the terms waive your constitutional right to file court lawsuits or participate in class action claims."
        }
      ],
      legal_disclaimer: MANDATORY_DISCLAIMER,

      companyName: "Zoom Video Communications",
      verdict: "Be Careful",
      estimatedReadTime: "2 min read (284 words)",
      quickNote: "Zoom's terms allow telemetry collection for AI model training, enforce mandatory individual arbitration, and require 30 days advance notice to cancel recurring auto-renewals.",
      suggestions: [
        {
          suggestion: "Review Zoom's account privacy settings after signing up and toggle off optional telemetry and AI feature data sharing.",
          reason: "Because this agreement grants Zoom a perpetual license to use session telemetry for machine learning training."
        },
        {
          suggestion: "Set a calendar reminder 35 days before your billing renewal date to evaluate whether you wish to continue your paid subscription.",
          reason: "Because Zoom requires cancellations to be submitted at least 30 days in advance to prevent automatic renewal charges."
        }
      ]
    }
  },
  {
    name: "Netflix Terms of Use",
    category: "Streaming & Media",
    icon: "Film",
    rawText: `NETFLIX TERMS OF USE

Welcome to Netflix! These Terms of Use govern your use of our service.

1. MEMBERSHIP AND BILLING. Your Netflix membership will continue month-to-month until terminated. To use the Netflix service you must have Internet access and a Netflix ready device, and provide us with one or more Payment Methods.

2. AUTO-RENEWAL AND REFUNDS. We will charge the membership fee for your next billing cycle to your Payment Method on the first day of each cycle. PAYMENTS ARE NONREFUNDABLE AND THERE ARE NO REFUNDS OR CREDITS FOR PARTIALLY USED MEMBERSHIP PERIODS OR UNWATCHED CONTENT. You may cancel at any time, but your cancellation will only take effect at the end of the current billing month.

3. SERVICE CHANGES AND LIMITATION OF LIABILITY. Netflix reserves the right to modify, replace, suspend, or terminate any titles, subscription plan pricing, or terms of service at any time in its sole discretion. TO THE MAXIMUM EXTENT PERMITTED BY LAW, NETFLIX'S ENTIRE LIABILITY SHALL BE LIMITED TO THE AMOUNT PAID BY YOU FOR ONE MONTH OF STREAMING SERVICE.

4. ARBITRATION AGREEMENT. If you reside in the United States, you and Netflix agree that any dispute, claim or controversy arising out of or relating in any way to the Netflix service shall be determined by binding arbitration or in small claims court. YOU AND NETFLIX AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.`,
    defaultAnalysis: {
      provider_title: "Netflix",
      domain_category: "Streaming & Media",
      overall_rating: "Balanced",
      risk_rating_label: "Balanced",
      estimated_read_time_minutes: 1,
      word_count: 198,
      raw_document_text: `NETFLIX TERMS OF USE...`,
      quick_matrix: {
        sells_or_monetizes_data: false,
        mandatory_arbitration: true,
        waives_class_action: true,
        auto_renewal_charges: true,
        easy_account_deletion: true
      },
      executive_summary: "Netflix presents consumer-standard streaming terms. Key features include monthly auto-renewal billing with a strict no-refund policy, a liability cap equal to one month's fee, and mandatory arbitration for U.S. subscribers.",
      document_summary: "Netflix presents consumer-standard streaming terms. Key features include monthly auto-renewal billing with a strict no-refund policy, a liability cap equal to one month's fee, and mandatory arbitration for U.S. subscribers.",
      analyzed_clauses: [
        {
          clause_id: 1,
          clause_title: "Strict No-Refund Policy",
          risk_level: "Be Careful",
          overall_clause_assessment: "Needs Attention",
          exact_original_wording: "PAYMENTS ARE NONREFUNDABLE AND THERE ARE NO REFUNDS OR CREDITS FOR PARTIALLY USED MEMBERSHIP PERIODS OR UNWATCHED CONTENT.",
          trigger_words: ["NONREFUNDABLE", "NO REFUNDS OR CREDITS", "PARTIALLY USED MEMBERSHIP PERIODS"],
          plain_english_summary: "Once a monthly payment processes, Netflix will not refund any money even if you cancel immediately or do not watch any content.",
          interpretation_rationale: "The explicit capitalized text 'PAYMENTS ARE NONREFUNDABLE' confirms that fees are final once billed.",
          recommendation: "Cancel your membership prior to your monthly billing renewal date if you intend to pause your subscription.",
          recommendation_rationale: "Cancellations take effect at the end of the billing period, ensuring you keep access until the period ends.",
          user_impact: "If your subscription renews and you cancel an hour later, you lose the monthly payment without partial pro-rated refunds.",
          exact_verbatim_quote: "PAYMENTS ARE NONREFUNDABLE AND THERE ARE NO REFUNDS OR CREDITS FOR PARTIALLY USED MEMBERSHIP PERIODS OR UNWATCHED CONTENT.",
          highlighted_evidence: "PAYMENTS ARE NONREFUNDABLE AND THERE ARE NO REFUNDS OR CREDITS",
          plain_english_translation: "Once a monthly payment processes, Netflix will not refund any money even if you cancel immediately or do not watch any content.",
          why_ai_summarized: "The explicit capitalized text 'PAYMENTS ARE NONREFUNDABLE' confirms that fees are final once billed.",
          potential_user_impact: "If your subscription renews and you cancel an hour later, you lose the monthly payment without partial pro-rated refunds.",
          why_recommended: "Cancellations take effect at the end of the billing period, ensuring you keep access until the period ends."
        },
        {
          clause_id: 2,
          clause_title: "Limitation of Financial Liability",
          risk_level: "Needs Attention",
          overall_clause_assessment: "Balanced",
          exact_original_wording: "NETFLIX'S ENTIRE LIABILITY SHALL BE LIMITED TO THE AMOUNT PAID BY YOU FOR ONE MONTH OF STREAMING SERVICE.",
          trigger_words: ["LIABILITY SHALL BE LIMITED", "ONE MONTH OF STREAMING SERVICE"],
          plain_english_summary: "Netflix limits its total legal liability for service disruptions or issues to the price of a single month's subscription fee.",
          interpretation_rationale: "The legal text caps maximum damages payable by Netflix to one month's service price.",
          recommendation: "Understand that streaming services carry minimal financial risk since damages are capped to low monthly rates.",
          recommendation_rationale: "This is a standard risk allocation clause for low-cost consumer entertainment subscriptions.",
          user_impact: "If a technical fault causes inconvenience, legal compensation cannot exceed a single monthly subscription cost.",
          exact_verbatim_quote: "NETFLIX'S ENTIRE LIABILITY SHALL BE LIMITED TO THE AMOUNT PAID BY YOU FOR ONE MONTH OF STREAMING SERVICE.",
          highlighted_evidence: "LIABILITY SHALL BE LIMITED TO THE AMOUNT PAID BY YOU FOR ONE MONTH",
          plain_english_translation: "Netflix limits its total legal liability for service disruptions or issues to the price of a single month's subscription fee.",
          why_ai_summarized: "The legal text caps maximum damages payable by Netflix to one month's service price.",
          potential_user_impact: "If a technical fault causes inconvenience, legal compensation cannot exceed a single monthly subscription cost.",
          why_recommended: "This is a standard risk allocation clause for low-cost consumer entertainment subscriptions."
        },
        {
          clause_id: 3,
          clause_title: "Binding Individual Arbitration (US Users)",
          risk_level: "Be Careful",
          overall_clause_assessment: "Needs Attention",
          exact_original_wording: "YOU AND NETFLIX AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER",
          trigger_words: ["binding arbitration", "INDIVIDUAL CAPACITY", "NOT AS A PLAINTIFF OR CLASS MEMBER"],
          plain_english_summary: "US subscribers agree to settle legal claims through individual arbitration or small claims court rather than class action lawsuits.",
          interpretation_rationale: "The wording bars class action proceedings and mandates individual dispute settlement.",
          recommendation: "Utilize small claims court if a direct billing dispute cannot be resolved through Netflix customer support.",
          recommendation_rationale: "Small claims court is explicitly allowed as an accessible alternative to formal arbitration.",
          user_impact: "Legal disputes must be handled on an individual basis, preventing joining group claims against Netflix.",
          exact_verbatim_quote: "YOU AND NETFLIX AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER",
          highlighted_evidence: "determined by binding arbitration... NOT AS A PLAINTIFF OR CLASS MEMBER",
          plain_english_translation: "US subscribers agree to settle legal claims through individual arbitration or small claims court rather than class action lawsuits.",
          why_ai_summarized: "The wording bars class action proceedings and mandates individual dispute settlement.",
          potential_user_impact: "Legal disputes must be handled on an individual basis.",
          why_recommended: "Small claims court is explicitly allowed as an accessible alternative to formal arbitration."
        }
      ],
      actionable_suggestions: [
        {
          suggestion: "Set a reminder a day before your monthly billing date if you plan to pause your account.",
          reason: "Because Netflix payments are strictly non-refundable once billed."
        }
      ],
      legal_disclaimer: MANDATORY_DISCLAIMER,

      companyName: "Netflix",
      verdict: "Balanced",
      estimatedReadTime: "1 min read (198 words)",
      quickNote: "Netflix terms feature standard month-to-month auto-renewal, a strict no-refund policy, and a one-month fee liability cap.",
      suggestions: [
        {
          suggestion: "Set a reminder a day before your monthly billing date if you plan to pause your account.",
          reason: "Because Netflix payments are strictly non-refundable once billed."
        }
      ]
    }
  }
];
