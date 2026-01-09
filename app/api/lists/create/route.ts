import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidCategory, type ListCategory } from '@/lib/categories'
import { generateListName } from '@/lib/list-names'

interface CreateListBody {
  category: ListCategory
  genre: string | null
  decade: string | null
  keyword: string | null
  certification: string | null
  language: string | null
  maxCount: string
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

    const body: CreateListBody = await request.json()

    // Validate category
    if (!isValidCategory(body.category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    // Check if template exists, create if not
    let query = supabase.from('list_templates').select('id').eq('category', body.category)

    // Build query with null checks
    if (body.genre === null) {
      query = query.is('genre', null)
    } else {
      query = query.eq('genre', body.genre)
    }

    if (body.decade === null) {
      query = query.is('decade', null)
    } else {
      query = query.eq('decade', body.decade)
    }

    if (body.keyword === null) {
      query = query.is('keyword', null)
    } else {
      query = query.eq('keyword', body.keyword)
    }

    if (body.certification === null) {
      query = query.is('certification', null)
    } else {
      query = query.eq('certification', body.certification)
    }

    if (body.language === null) {
      query = query.is('language', null)
    } else {
      query = query.eq('language', body.language)
    }

    let { data: template } = await query.eq('max_count', body.maxCount).single()

    if (!template) {
      // Create new template
      const displayName = generateListName(
        body.genre,
        body.decade,
        body.maxCount,
        body.keyword,
        body.certification,
        body.language,
        body.category
      )

      const { data: newTemplate, error: templateError } = await supabase
        .from('list_templates')
        .insert({
          category: body.category,
          genre: body.genre,
          decade: body.decade,
          keyword: body.keyword,
          certification: body.certification,
          language: body.language,
          max_count: body.maxCount,
          display_name: displayName,
          created_by: user.id,
        })
        .select('id')
        .single()

      if (templateError) {
        console.error('Template creation error:', templateError)
        return NextResponse.json({ error: templateError.message }, { status: 500 })
      }
      template = newTemplate
    }

    // Check if user already has this list
    const { data: existingList } = await supabase
      .from('user_lists')
      .select('id')
      .eq('user_id', user.id)
      .eq('template_id', template.id)
      .single()

    if (existingList) {
      return NextResponse.json({ listId: existingList.id })
    }

    // Create user's list
    const { data: userList, error: listError } = await supabase
      .from('user_lists')
      .insert({
        user_id: user.id,
        template_id: template.id,
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
