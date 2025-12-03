# Global Variables System Guide

## Overview

The global variables system allows you to define data once in your profile and reuse it across all your apps, pages, and components using mustache template syntax: `{{variable_name}}`.

## Features

- ✅ Auto-sync from Profile Manager
- ✅ Mustache template syntax (`{{key}}` or `{{key:default}}`)
- ✅ Click-to-copy variable picker in Puck editor
- ✅ Real-time variable replacement in published pages
- ✅ Inline variable suggestions in text fields
- ✅ Categorized variable organization

## How It Works

### 1. Define Variables in Profile Manager

Navigate to `/dashboard/profile/manage` and fill in your profile fields:

- **Display Name** → `{{full_name}}`
- **Phone** → `{{phone}}`
- **Email** → `{{email}}`
- **Bio** → `{{bio}}`
- **Company** → `{{company}}`
- **Job Title** → `{{job_title}}`
- **Website** → `{{website}}`
- **Social Links** → `{{linkedin}}`, `{{github}}`, `{{twitter}}`, etc.

**Auto-sync:** Every time you save your profile, these fields are automatically converted to global variables.

### 2. Use Variables in Puck Editor

#### Method 1: Variable Picker (Recommended)

1. Open the Puck editor at `/dashboard/puck`
2. Click the **Variables** button in the toolbar (between "New Component" and "Help")
3. Browse or search for your variable
4. Click to copy the mustache syntax: `{{variable_name}}`
5. Paste into any text field, button label, heading, etc.

#### Method 2: Manual Typing

Simply type `{{variable_name}}` directly in any text field:

```
Hello, my name is {{full_name}}!
Contact me at {{email}} or {{phone}}.
```

#### Method 3: Inline Suggestions (Advanced)

When using the `TextFieldWithVariables` component, type `{{` and you'll see auto-suggestions:

```tsx
import { TextFieldWithVariables } from '@/components/TextFieldWithVariables';

<TextFieldWithVariables
  value={props.text}
  onChange={(val) => setProp('text', val)}
  placeholder="Enter text..."
/>
```

### 3. Variables Work Everywhere

Once you insert `{{variable_name}}`, it will be replaced with the actual value:

- ✅ In published pages (`/published/your-page`)
- ✅ In app pages (`/published/app/[id]/page`)
- ✅ Across all components (text, buttons, headings, links, etc.)
- ✅ Real-time updates when you change profile data

### 4. Default Values

You can provide fallback values using a colon:

```
{{phone:Not provided}}
{{email:contact@example.com}}
```

If the variable is empty or doesn't exist, the default value will be used.

## Available Variables

### Profile Information
- `{{full_name}}` - Your display name
- `{{email}}` - Email address
- `{{phone}}` - Phone number
- `{{bio}}` - Biography/description
- `{{company}}` - Company name
- `{{job_title}}` - Job title/position
- `{{website}}` - Personal website URL

### Social Links
- `{{linkedin}}` - LinkedIn profile URL
- `{{github}}` - GitHub profile URL
- `{{twitter}}` - Twitter/X profile URL
- `{{facebook}}` - Facebook profile URL
- `{{instagram}}` - Instagram profile URL

### Address (vCard)
- `{{street}}` - Street address
- `{{city}}` - City
- `{{state}}` - State/Province
- `{{zip}}` - Postal/ZIP code
- `{{country}}` - Country

## API Reference

### GET /api/variables
Fetch all variables for the authenticated user.

**Response:**
```json
{
  "variables": [
    {
      "key": "full_name",
      "label": "Full Name",
      "value": "John Doe",
      "category": "Profile"
    }
  ]
}
```

**Query Parameters:**
- `?format=map` - Returns as key-value object instead of array

### POST /api/variables
Create or update a variable.

**Request Body:**
```json
{
  "key": "custom_field",
  "value": "Custom Value",
  "label": "Custom Field",
  "category": "Custom"
}
```

### DELETE /api/variables
Delete a variable.

**Request Body:**
```json
{
  "key": "custom_field"
}
```

## Advanced Usage

### Creating Custom Variables

You can create variables beyond the auto-synced profile fields:

```typescript
await fetch('/api/variables', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    key: 'project_name',
    value: 'My Awesome Project',
    label: 'Project Name',
    category: 'Custom',
    description: 'The name of my current project'
  })
});
```

### Programmatic Variable Replacement

```typescript
import { getUserVariablesMap, replaceVariables } from '@/lib/variables/service';

// Get user's variables as a map
const vars = await getUserVariablesMap(userId);

// Replace in a string
const text = "Hello {{full_name}}, your email is {{email}}";
const result = replaceVariables(text, vars);

// Replace in an object (recursive)
import { replaceVariablesInObject } from '@/lib/variables/service';

const data = {
  title: "About {{full_name}}",
  content: {
    text: "Contact: {{email}}"
  }
};
const processed = replaceVariablesInObject(data, vars);
```

### Variable Categories

Variables are organized into categories for easier browsing:

- **Profile** - Basic profile information
- **Contact** - Contact details
- **Social** - Social media links
- **Address** - Location information
- **Custom** - User-created variables

## Best Practices

1. **Use Descriptive Keys**: `{{company_name}}` is better than `{{cn}}`
2. **Provide Defaults**: Always use `{{key:default}}` for optional fields
3. **Keep It Simple**: Don't nest variables inside variables
4. **Test Before Publishing**: Preview your pages to ensure variables are replaced correctly
5. **Update Profile Once**: Changes propagate to all pages automatically

## Troubleshooting

### Variables Not Showing?

1. Make sure you saved your profile at `/dashboard/profile/manage`
2. Check that you're using the correct mustache syntax: `{{key}}`
3. Verify the variable exists by clicking the Variables button in Puck editor

### Variables Not Replacing?

1. Ensure the page is published (not just saved)
2. Check the browser console for errors
3. Try refreshing the published page
4. Verify the userId is attached to the document

### Variable Suggestions Not Appearing?

1. Make sure you're using `TextFieldWithVariables` component
2. Type `{{` to trigger suggestions
3. Check your network tab for `/api/variables` request

## Examples

### Business Card Component

```tsx
<div className="business-card">
  <h1>{{full_name}}</h1>
  <p>{{job_title}} at {{company}}</p>
  <a href="mailto:{{email}}">{{email}}</a>
  <a href="tel:{{phone}}">{{phone}}</a>
</div>
```

### Contact Form Pre-fill

```tsx
<input 
  type="email" 
  value="{{email}}"
  placeholder="Your email"
/>
<input 
  type="tel" 
  value="{{phone}}"
  placeholder="Your phone"
/>
```

### Dynamic Footer

```tsx
<footer>
  <p>© 2024 {{company:My Company}}. All rights reserved.</p>
  <p>Contact: {{email:info@example.com}}</p>
</footer>
```

## System Architecture

```
┌─────────────────────────────────────┐
│  /dashboard/profile/manage          │
│  (Profile Manager)                  │
└─────────────┬───────────────────────┘
              │ Save Profile
              ↓
┌─────────────────────────────────────┐
│  syncProfileToVariables()           │
│  (Auto-sync service)                │
└─────────────┬───────────────────────┘
              │ Creates/Updates
              ↓
┌─────────────────────────────────────┐
│  GlobalVariable Collection          │
│  (MongoDB)                          │
└─────────────┬───────────────────────┘
              │ Fetched by
              ↓
┌─────────────────────────────────────┐
│  /api/variables                     │
│  (REST API)                         │
└─────────────┬───────────────────────┘
              │ Used in
              ↓
┌─────────────────────────────────────┐
│  Puck Editor (VariablePicker)       │
│  + Published Pages (Runtime)        │
└─────────────────────────────────────┘
```

## Database Schema

```typescript
{
  userId: ObjectId,           // Owner of the variable
  key: string,                // Unique identifier (e.g., "full_name")
  value: string,              // Current value
  label: string,              // Display name
  category: string,           // Grouping category
  description?: string,       // Optional description
  createdAt: Date,
  updatedAt: Date
}

// Compound index: userId + key (unique)
```

## Security

- ✅ Variables are scoped to users (can't access other users' variables)
- ✅ API routes require authentication via NextAuth session
- ✅ Published pages only show variables from the page owner
- ✅ No sensitive data exposed in client-side code

## Performance

- ✅ Variables cached per request (no repeated DB queries)
- ✅ Bulk sync operations minimize database writes
- ✅ Fast mustache replacement using regex
- ✅ Indexed queries for optimal lookup speed

---

**Need help?** Check the Help button in the Puck editor or contact support.
