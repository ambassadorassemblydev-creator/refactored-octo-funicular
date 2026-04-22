# Momoh Beauty / Ambassadors Assembly Project Guidelines

## Organizational Terminology
To ensure clarity across the application, follow this mapping for the church structure:

| Term | Scope | Example | Description |
| :--- | :--- | :--- | :--- |
| **Ministry** | Outreach / Community | Youth Ministry, Outreach | Outward-facing spiritual groups. |
| **Department** | Operational / Internal | Media, Finance, Logistics | Internal functional units that support the church. |
| **Role** | Worker Function | Lead, Secretary, Member | The specific responsibility held by a worker in a department. |
| **Member Title** | Honorific / Rank | Pastor, Elder, Deacon, Dr | The overarching title assigned to a member. |

## Design Principles
- **Brand**: Momoh Beauty (Luxury Lip Beauty Brand).
- **Style**: High-end, polished, luxury aesthetic.
- **UI**: Use shadcn/ui customized for a premium feel.
- **Responsiveness**: Mobile-first design is mandatory.

## Technical Rules
- **Authentication**: Supabase Auth with centralized state in `AuthContext`.
- **RBAC**: Use the `roles` table for system permissions (`admin`, `pastor`, `member`).
- **Data Fetching**: Implement retry logic for Supabase lock errors.
- **SQL Functions**: `user_has_role(p_role_name text)` must be `SECURITY DEFINER`.
