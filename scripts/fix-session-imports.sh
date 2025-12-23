#!/bin/bash

# Script to replace getServerSession imports from #auth to use the centralized session utility
# This ensures impersonation works consistently across all API endpoints

echo "Fixing session imports in API endpoints..."

# Find all files in server/api that import from #auth and replace with centralized session
find server/api -name "*.ts" -type f -exec sed -i '' \
  -e "s/import { getServerSession } from '#auth'/import { getServerSession } from '..\/..\/utils\/session'/g" \
  -e "s/import { getServerSession } from '#auth'/import { getServerSession } from '..\/utils\/session'/g" \
  -e "s/import { getServerSession } from '#auth'/import { getServerSession } from '..\/..\/..\/utils\/session'/g" \
  {} +

echo "Session imports fixed!"
echo "Note: Some paths may need manual adjustment based on directory depth"
