import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Article ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Bulk delete
export async function POST(request: Request) {
  try {
    const { action, ids, olderThan } = await request.json();

    if (action === 'delete-selected' && ids?.length > 0) {
      const { error } = await supabase
        .from('articles')
        .delete()
        .in('id', ids);

      if (error) throw error;
      return NextResponse.json({ success: true, deleted: ids.length });
    }

    if (action === 'delete-older' && olderThan) {
      const { data, error } = await supabase
        .from('articles')
        .delete()
        .lt('published_at', olderThan)
        .select('id');

      if (error) throw error;
      return NextResponse.json({ success: true, deleted: data?.length || 0 });
    }

    if (action === 'delete-all') {
      const { data, error } = await supabase
        .from('articles')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
        .select('id');

      if (error) throw error;
      return NextResponse.json({ success: true, deleted: data?.length || 0 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
