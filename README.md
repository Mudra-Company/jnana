# Mudra Platform (Jnana HR)

A comprehensive Human Capital Management platform focused on the **RIASEC** methodology for employee assessment, skill mapping, and organizational management.

## 🚀 Features

### 1. Multi-Tenant Architecture
*   **Super Admin Console**: Manage multiple companies (tenants) from a single dashboard.
*   **Impersonation Mode**: Super Admins can "enter" a company environment to assist with configuration.
*   **Company Management**: Create, edit, and delete company profiles with detailed metadata (Industry, Size, Logo, etc.).

### 2. Organizational Chart Management
*   **Interactive Tree View**: Visual editor for company hierarchy (Departments, Teams).
*   **Recursive Structure**: Supports infinite nesting of organizational units.
*   **User Assignment**: Drag-and-drop style assignment of employees to specific nodes.

### 3. RIASEC Assessment System
*   **4-Part Questionnaire**: Implements the standardized 4-section RIASEC test (Behavior, Interests, Dream Jobs, Self-Evaluation).
*   **Scoring Engine**: Complex scoring logic that maps user choices to 6 dimensions (R-I-A-S-E-C).
*   **Profile Generation**: Automatically generates a 3-letter profile code (e.g., "A-I-R").

### 4. Job Benchmarking & Analytics
*   **Benchmark Database**: Configurable database of job profiles with "Ideal Scores".
*   **Gap Analysis**: Radar chart comparison between User Results and Job Benchmarks.
*   **Competency Grid**: Visualizes dominant traits and their intensity (1-5 scale) based on raw scores.

## 🛠 Tech Stack

*   **Frontend**: React 18, TypeScript
*   **Styling**: Tailwind CSS (custom `jnana` theme)
*   **Visualization**: Recharts (Radar, Bar charts)
*   **Icons**: Lucide React
*   **State**: Local React State (Mock backend)

## 📂 Project Structure

*   `App.tsx`: Main application controller, view routing, and primary views.
*   `services/riasecService.ts`: Core business logic (Scoring, Report Generation, Benchmarking).
*   `data/riasecContent.ts`: Static content for the RIASEC methodology (Descriptions, Quotes, Job mappings).
*   `types.ts`: TypeScript interfaces for the domain model.
*   `constants.ts`: Configuration constants and initial mock data.

## 📖 Usage Guide

### Super Admin
1.  Log in as Super Admin.
2.  Use the **Aziende** tab to create new company tenants.
3.  Use the **DB Lavori** tab to configure benchmark scores for specific job titles.
4.  Click "Entra nell'ambiente" to manage a specific company.

### Tenant Admin
1.  Log in as a Tenant Admin (or impersonate via Super Admin).
2.  **Dashboard**: View invited users, completion status, and aggregate KPIs.
3.  **Organigramma**: Build the company tree and assign users to teams.
4.  **Invito**: Send test invitations to employees.

### User Flow
1.  Users receive an invite (simulated via "Simula Test").
2.  Complete the 4-part questionnaire.
3.  View immediate results including:
    *   RIASEC Profile Code.
    *   Detailed textual report.
    *   Comparison against their current Job Title benchmark.

## 🧠 RIASEC Dimensions

*   **R (Realistico)**: Praticità, manualità, concretezza.
*   **I (Investigativo)**: Analisi, logica, curiosità intellettuale.
*   **A (Artistico)**: Creatività, innovazione, anticonformismo.
*   **S (Sociale)**: Empatia, cooperazione, supporto.
*   **E (Intraprendente)**: Leadership, dinamismo, competizione.
*   **C (Convenzionale)**: Organizzazione, precisione, metodo.