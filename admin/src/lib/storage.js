import { supabase } from '@/lib/supabase'

// Uploads a File to the public product-images bucket and returns its
// public URL. RLS on storage.objects (see 0006_storage.sql) means this
// call only succeeds for a session whose profile role is 'admin' —
// nothing extra to check on the frontend.
export const uploadImage = async (file) => {
  const ext = file.name.split('.').pop()
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from('product-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw new Error(error.message || 'Image upload failed.')

  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}
