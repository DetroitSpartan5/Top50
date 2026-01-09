import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CreateFromTemplateBody {
  templateId: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateFromTemplateBody = await request.json()

    if (!body.templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    // Check if user already has this list
    const { data: existingList } = await supabase
      .from('user_lists')
      .select('id')
      .eq('user_id', user.id)
      .eq('template_id', body.templateId)
      .single()

    if (existingList) {
      return NextResponse.json({ listId: existingList.id })
    }

    // Create user's list
    const { data: userList, error: listError } = await supabase
      .from('user_lists')
      .insert({
        user_id: user.id,
        template_id: body.templateId,
      })
      .select('id')
      .single()

    if (listError) {
      console.error('List creation error:', listError)
      return NextResponse.json({ error: listError.message }, { status: 500 })
    }

    return NextResponse.json({ listId: userList.id })
  } catch (error) {
    console.error('Create list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
