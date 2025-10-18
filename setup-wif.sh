#!/usr/bin/env bash
set -euo pipefail

########################################
# 1) 基本變數（請依實際情況調整）
########################################
PROJECT_ID="today-go-where-bot"            # 你的 GCP 專案 ID（從錯誤訊息判斷）
REGION="asia-east1"                        # 你的 Artifact Registry / Cloud Run 地區
REPO="go-where"                            # Artifact Registry repo 名稱（自行命名或用原本的）
SERVICE_NAME="today-go-where-api"          # Cloud Run 服務名稱（對應 vars.SERVICE_NAME）

# 部署用 Service Account（GitHub Actions 冒用的那個；對應 secrets.DEPLOY_SA_EMAIL）
DEPLOY_SA="deploy-gha@${PROJECT_ID}.iam.gserviceaccount.com"

# Cloud Run 執行用 Service Account（你 workflow 裡寫的 cr-runtime@...）
RUNTIME_SA="cr-runtime@${PROJECT_ID}.iam.gserviceaccount.com"

# 你的 WIF Pool / Provider（名稱依你當初建立時的設定）
POOL_ID="github"                           # e.g. github
PROVIDER_ID="github-oidc"                  # e.g. github-oidc

# 你的 GitHub 倉庫與分支（用於鎖定 main 分支冒用權）
GITHUB_OWNER="aaronhsu629"                 # 你的 GitHub 使用者/Org
GITHUB_REPO="today-go-where-bot"           # 倉庫名稱
BRANCH="main"                              # 只允許 main 分支

########################################
# 2) 取得專案編號、啟用 API（冪等）
########################################
echo "==> Configure project"
gcloud config set project "${PROJECT_ID}"

PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")"

echo "==> Enable required APIs (idempotent)"
gcloud services enable \
  iam.googleapis.com \
  artifactregistry.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com

########################################
# 3) 建立（或確保存在）兩個 Service Accounts（冪等）
########################################
echo "==> Ensure service accounts exist (idempotent)"
gcloud iam service-accounts create "$(cut -d@ -f1 <<<"${DEPLOY_SA}")" \
  --display-name="GitHub Actions Deploy SA" || true

gcloud iam service-accounts create "$(cut -d@ -f1 <<<"${RUNTIME_SA}")" \
  --display-name="Cloud Run Runtime SA" || true

########################################
# 4) Artifact Registry repo（冪等）
########################################
echo "==> Ensure Artifact Registry repo exists (idempotent)"
gcloud artifacts repositories create "${REPO}" \
  --repository-format=docker \
  --location="${REGION}" \
  --description="Docker images for Today Go Where" || true

########################################
# 5) 權限：部署 SA 需要的角色
########################################
echo "==> Grant roles to DEPLOY SA on the project"
# 推鏡像
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${DEPLOY_SA}" \
  --role="roles/artifactregistry.writer"

# 部署 Cloud Run
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${DEPLOY_SA}" \
  --role="roles/run.admin"

# 允許它指定 Runtime SA（這個角色要綁在 Runtime SA 上面）
echo "==> Allow DEPLOY SA to use RUNTIME SA (iam.serviceAccountUser)"
gcloud iam service-accounts add-iam-policy-binding "${RUNTIME_SA}" \
  --member="serviceAccount:${DEPLOY_SA}" \
  --role="roles/iam.serviceAccountUser"

########################################
# 6) 權限：Runtime SA 需要的角色（讀 Secret 等）
########################################
echo "==> Grant roles to RUNTIME SA (Secret Manager access for --set-secrets)"
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/secretmanager.secretAccessor"

########################################
# 7) 最重要：WIF 綁定（讓 GitHub OIDC 可「冒用」DEPLOY_SA）
########################################
echo "==> Bind Workload Identity (only main branch allowed)"
gcloud iam service-accounts add-iam-policy-binding "${DEPLOY_SA}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/attribute.sub/repo:${GITHUB_OWNER}/${GITHUB_REPO}:ref:refs/heads/${BRANCH}"

# （若你原本的 Provider 是用 attribute.repository 鎖定整個 repo，可改用下面這行）
# gcloud iam service-accounts add-iam-policy-binding "${DEPLOY_SA}" \
#   --role="roles/iam.workloadIdentityUser" \
#   --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/attribute.repository/${GITHUB_OWNER}/${GITHUB_REPO}"

########################################
# 8) 顯示檢查結果
########################################
echo "==> Show who can impersonate DEPLOY_SA (should include your principalSet)"
gcloud iam service-accounts get-iam-policy "${DEPLOY_SA}" --format=json

echo "==> All set. Next step: rerun your GitHub Actions workflow."
echo "   If docker login/push still fails, verify repo path:"
echo "     ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}"
