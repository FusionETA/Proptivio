# Deploying to Vercel

This guide will help you deploy the Sales Portal to Vercel.

## Prerequisites

1.  **Vercel Account**: Ensure you have an account at [vercel.com](https://vercel.com).
2.  **Bitrix Webhook URL**: You will need your `BITRIX24_WEBHOOK_URL` handy.

## Deployment Steps

### Method 1: Using the Command Line (Recommended)

1.  Run the deployment command:
    ```bash
    npx vercel
    ```

2.  Follow the interactive prompts:
    *   **Set up and deploy?** [Y]
    *   **Which scope?** [Select your account]
    *   **Link to existing project?** [N]
    *   **Project Name**: `agent-sales-portal` (or your preferred name)
    *   **In which directory?** `./`
    *   **Want to modify these settings?** [N] (Next.js default settings are usually correct)

3.  **Important: Environment Variables**
    By default, the deployment might fail or the app won't fetch data if the environment variables aren't set.
    
    After the project is linked (created), you need to add your Environment Variable:
    
    Run:
    ```bash
    npx vercel env add BITRIX24_WEBHOOK_URL
    ```
    *   Paste your webhook URL when prompted.
    *   Select `Production`, `Preview`, and `Development` environments.

4.  **Final Deployment**
    Redeploy with the new environment variable:
    ```bash
    npx vercel --prod
    ```

### Method 2: Via Vercel Dashboard (Git Integration)

1.  Push your code to a Git repository (GitHub, GitLab, or Bitbucket).
2.  Go to the Vercel Dashboard and click **"Add New..."** -> **"Project"**.
3.  Import your repository.
4.  In the **"Configure Project"** screen:
    *   Expand **"Environment Variables"**.
    *   Key: `BITRIX24_WEBHOOK_URL`
    *   Value: `YOUR_BITRIX_WEBHOOK_URL` (e.g., `https://fusion.bitrix24.com/rest/1/69fkpnf2uvzu7lo6/`)
5.  Click **"Deploy"**.

## Verifying Deployment

Once deployed, visit the URL provided by Vercel.
Check the "Retail Units" tab to ensure the API is fetching data correctly.
