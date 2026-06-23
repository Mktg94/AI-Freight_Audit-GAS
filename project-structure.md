# Project Structure

```text
.
├── api/
│   ├── _app.ts
│   ├── index.js
│   ├── index.js.map
│   └── app.ts
├── app/
│   ├── api/
│   │   ├── contracts/
│   │   │   └── route.ts
│   │   ├── contracts/[id]/
│   │   │   └── route.ts
│   │   ├── disputes/
│   │   │   └── route.ts
│   │   ├── disputes/[id]/
│   │   │   ├── route.ts
│   │   │   └── send/
│   │   │       └── route.ts
│   │   ├── disputes/create/
│   │   │   └── route.ts
│   │   ├── invoices/
│   │   │   └── [id]/
│   │   │       ├── approve-clean/
│   │   │       │   └── route.ts
│   │   │       ├── status/
│   │   │       │   └── route.ts
│   │   │       └── route.ts
│   │   ├── invoices/batch/
│   │   │   └── [batchId]/
│   │   │       ├── status/
│   │   │       │   └── route.ts
│   │   │       └── upload/
│   │   │           └── route.ts
│   │   ├── invoices/batch-upload/
│   │   │   └── route.ts
│   │   ├── invoices/detect-multi/
│   │   │   └── route.ts
│   │   ├── invoices/upload/
│   │   │   └── route.ts
│   │   ├── line-items/
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── team/
│   │   │   ├── [memberId]/
│   │   │   │   └── route.ts
│   │   │   ├── accept-invite/
│   │   │   └── invite/
│   │   │       └── route.ts
│   │   └── team/members/
│   │       └── route.ts
│   ├── auth/
│   │   ├── accept-invite/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── update-password/page.tsx
│   ├── contracts/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── contracts/new/page.tsx
│   ├── dashboard/layout.tsx
│   ├── dashboard/page.tsx
│   ├── disputes/page.tsx
│   ├── disputes/[id]/page.tsx
│   ├── invoices/page.tsx
│   ├── invoices/[id]/page.tsx
│   ├── invoices/upload/page.tsx
│   ├── pricing/page.tsx
│   ├── reports/page.tsx
│   ├── settings/page.tsx
│   ├── error.tsx
│   ├── layout.tsx
│   └── not-found.tsx
├── assets/
├── components/
│   ├── contracts/
│   │   ├── ContractCard.tsx
│   │   ├── ContractForm.tsx
│   │   ├── ContractPageClient.tsx
│   │   └── EmptyState.tsx
│   ├── dashboard/
│   │   ├── CarrierDiscrepancyChart.tsx
│   │   ├── ErrorTypeChart.tsx
│   │   ├── FlaggedInvoicesQueue.tsx
│   │   ├── SavingsAreaChart.tsx
│   │   ├── SavingsChart.tsx
│   │   └── StatCard.tsx
│   ├── invoices/
│   │   ├── ApprovalReasonModal.tsx
│   │   ├── AuditResultPanel.tsx
│   │   ├── BatchProgressTracker.tsx
│   │   ├── DataTable.tsx
│   │   ├── EmptyState.tsx
│   │   ├── FilterBar.tsx
│   │   ├── InvoiceStatusBadge.tsx
│   │   ├── LineItemTable.tsx
│   │   ├── SplitPreviewModal.tsx
│   │   └── UploadDropzone.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── TopBar.tsx
│   ├── settings/
│   │   ├── InviteMemberForm.tsx
│   │   └── TeamMemberList.tsx
│   └── shared/
│       ├── ConfidenceBar.tsx
│       ├── DataTable.tsx
│       ├── EmptyState.tsx
│       ├── LoadingSpinner.tsx
│       ├── PermissionGate.tsx
│       └── UsageLimitBanner.tsx
├── lib/
│   ├── email.ts
│   ├── email-templates.ts
│   ├── ai/
│   │   ├── auditInvoice.ts
│   │   ├── extractInvoice.ts
│   │   ├── geminiClient.ts
│   │   ├── generateDispute.ts
│   │   ├── invoiceSplitter.ts
│   │   └── stripPII.ts
│   ├── auth/
│   │   ├── planLimits.ts
│   │   ├── RoleContext.tsx
│   │   └── roles.ts
│   ├── constants/
│   │   └── plans.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── utils/
│       ├── calculateSavings.ts
│       ├── formatCurrency.ts
│       └── formatDate.ts
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── components/
│       ├── AnalyticsView.tsx
│       ├── AuditLogView.tsx
│       ├── ContractList.tsx
│       ├── DisputeManager.tsx
│       ├── InvoiceList.tsx
│       └── (other files may exist)
├── supabase/
│   └── schema.sql
├── types/
│   └── index.ts
│   └── next-server.d.ts
├── index.html
├── metadata.json
├── package.json
├── package-lock.json
├── README.md
├── SETUP_GUIDE.md
├── server.ts
├── schema1.sql
├── schema2.sql
├── schema3.sql
├── schema4.sql
├── schema5.sql
├── schema6.sql
├── schema7.sql
├── tsconfig.json
├── vite-env.d.ts
├── vite.config.ts
├── vercel.json
├── history.txt
├── .gitignore
└── root docs
    ├── FREIGHTAUDIT_AI_OVERVIEW.md
    ├── admin-dashboard-prompt.md
    └── letter.md
```


