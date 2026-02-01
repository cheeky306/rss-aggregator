import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { id, action } = await request.json();

    if (!id || !action) {
      return NextResponse.json({ error: 'ID and action required' }, { status: 400 });
    }

    if (action === 'toggle-favorite') {
      // Get current state
      const { data: article } = await supabase
        .from('articles')
        .select('is_favorite')
        .eq('id', id)
        .single();

      const newValue = !article?.is_favorite;

      const { error } = await supabase
        .from('articles')
        .update({ is_favorite: newValue })
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true, is_favorite: newValue });
    }

    if (action === 'toggle-read-later') {
      // Get current state
      const { data: article } = await supabase
        .from('articles')
        .select('is_read_later')
        .eq('id', id)
        .single();

      const newValue = !article?.is_read_later;

      const { error } = await supabase
        .from('articles')
        .update({ is_read_later: newValue })
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true, is_read_later: newValue });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
