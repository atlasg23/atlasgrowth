#!/usr/bin/env node

const fs = require('fs').promises
const path = require('path')

const templates = [
  { file: 'PestControlTemplate.tsx', type: 'pest-control' },
  { file: 'PressureWashingTemplate.tsx', type: 'pressure-washing' },
  { file: 'RoofingTemplate.tsx', type: 'roofing' },
  { file: 'TreeServiceTemplate.tsx', type: 'tree-service' }
]

async function addTrackingToTemplates() {
  console.log('📊 Adding TemplateViewTracker to all templates...\n')
  
  for (const template of templates) {
    const filePath = path.join(__dirname, '../components/templates', template.file)
    
    try {
      let content = await fs.readFile(filePath, 'utf8')
      
      // Check if already has tracking
      if (content.includes('TemplateViewTracker')) {
        console.log(`✅ ${template.file} - already has tracking`)
        continue
      }
      
      // Add import
      const importLine = "import TemplateViewTracker from '@/components/TemplateViewTracker'"
      if (!content.includes(importLine)) {
        // Find last import and add after it
        const lines = content.split('\n')
        let lastImportIndex = -1
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ')) {
            lastImportIndex = i
          }
        }
        
        if (lastImportIndex !== -1) {
          lines.splice(lastImportIndex + 1, 0, importLine)
          content = lines.join('\n')
        }
      }
      
      // Add tracker component - look for return statement and div
      const trackerComponent = `      {/* Template View Tracker */}
      <TemplateViewTracker businessSlug={business.slug} templateType="${template.type}" />`
      
      // Find the first div after return and add tracker
      content = content.replace(
        /(\s*return\s*\(\s*<div[^>]*>)/,
        `$1\n${trackerComponent}`
      )
      
      await fs.writeFile(filePath, content)
      console.log(`📝 ${template.file} - added tracking`)
      
    } catch (error) {
      console.error(`❌ Error processing ${template.file}:`, error.message)
    }
  }
  
  console.log('\n✅ All templates updated with tracking!')
}

addTrackingToTemplates().catch(console.error)