#!/usr/bin/env bash
# Assign a custom SonarCloud quality gate to this project (requires org permission on the token).
#
# Prefer numeric gate id from Quality Gates → your gate → URL or API list:
#   curl -u TOKEN: "https://sonarcloud.io/api/qualitygates/list?organization=hamza-spc"
#
#   export SONAR_TOKEN='your_user_token'
#   export SONAR_QUALITY_GATE_ID='150456'
#   bash Backend/scripts/select-sonar-quality-gate.sh
#
# If the API returns "not allowed to modify Quality gates", assign in the UI:
# Project → Administration → Quality Gate.
#
set -euo pipefail
ORG="${SONAR_ORGANIZATION:-hamza-spc}"
PROJ="${SONAR_PROJECT_KEY:-hamza-spc_parkingo}"
GATE_ID="${SONAR_QUALITY_GATE_ID:?Set SONAR_QUALITY_GATE_ID (numeric id from SonarCloud)}"
TOKEN="${SONAR_TOKEN:?Set SONAR_TOKEN}"

curl -sf -X POST -u "${TOKEN}:" \
  --data-urlencode "organization=${ORG}" \
  --data-urlencode "projectKey=${PROJ}" \
  --data-urlencode "gateId=${GATE_ID}" \
  "https://sonarcloud.io/api/qualitygates/select"

echo "Quality gate id ${GATE_ID} selected for ${PROJ}."
