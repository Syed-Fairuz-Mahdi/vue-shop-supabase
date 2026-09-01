<script setup>
import { onMounted, ref } from 'vue'
import { UserPlus, Loader2, ShieldCheck, Mail, CheckCircle2, AlertTriangle } from 'lucide-vue-next'

import { supabase } from '@/lib/supabase'

const email = ref('')
const isSending = ref(false)
const resultMessage = ref('')
const resultKind = ref('') // 'success' | 'error'

const invites = ref([])
const isLoadingInvites = ref(true)

// admin_invites is readable by any admin under RLS (admin_invites_select_admin).
// This is purely a history log — it never decides who is actually an
// admin; profiles.role is the only thing that does that.
const loadInvites = async () => {
  isLoadingInvites.value = true

  const { data } = await supabase
    .from('admin_invites')
    .select('id, email, kind, created_at, invited_by:profiles!admin_invites_invited_by_fkey(email)')
    .order('created_at', { ascending: false })

  invites.value = data || []
  isLoadingInvites.value = false
}

onMounted(loadInvites)

const sendInvite = async () => {
  resultMessage.value = ''
  resultKind.value = ''

  const trimmed = email.value.trim()
  if (!trimmed) return

  isSending.value = true

  try {
    const { data, error } = await supabase.functions.invoke('invite-admin', {
      body: { email: trimmed },
    })

    // supabase.functions.invoke() only rejects on network failure —
    // a non-2xx response (our validation/auth errors) still lands here
    // as `error`, with the JSON body typically available on error.context.
    if (error) {
      let message = 'Something went wrong sending the invite.'
      try {
        const body = await error.context.json()
        message = body.error || message
      } catch {
        // fall back to the generic message above
      }
      resultKind.value = 'error'
      resultMessage.value = message
      return
    }

    resultKind.value = 'success'
    resultMessage.value = data.message
    email.value = ''
    await loadInvites()
  } catch {
    resultKind.value = 'error'
    resultMessage.value = 'Something went wrong sending the invite. Please try again.'
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold">Team &amp; Admin Access</h1>
      <p class="text-gray-500 mt-2">Grant admin access to someone else, directly from here.</p>
    </div>

    <!-- Invite form -->
    <div class="bg-white rounded-2xl shadow p-6 mb-8 max-w-xl">
      <h2 class="font-bold text-lg mb-1">Grant admin access</h2>
      <p class="text-sm text-gray-500 mb-4">
        If the email already has an account, it's promoted immediately. If it's new, they'll get an email to
        set a password — they'll already have admin access once they do.
      </p>

      <form class="flex flex-col sm:flex-row gap-3" @submit.prevent="sendInvite">
        <input
          v-model="email"
          type="email"
          required
          placeholder="teammate@example.com"
          class="flex-1 border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          :disabled="isSending"
          class="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
        >
          <Loader2 v-if="isSending" class="w-4 h-4 animate-spin" />
          <UserPlus v-else class="w-4 h-4" />
          Grant Access
        </button>
      </form>

      <p
        v-if="resultMessage"
        class="mt-4 flex items-start gap-2 text-sm"
        :class="resultKind === 'success' ? 'text-green-700' : 'text-red-600'"
      >
        <CheckCircle2 v-if="resultKind === 'success'" class="w-4 h-4 mt-0.5 flex-shrink-0" />
        <AlertTriangle v-else class="w-4 h-4 mt-0.5 flex-shrink-0" />
        {{ resultMessage }}
      </p>
    </div>

    <!-- History -->
    <div class="bg-white rounded-2xl shadow p-6">
      <h2 class="font-bold text-lg mb-4 flex items-center gap-2">
        <ShieldCheck class="w-5 h-5 text-blue-600" />
        Admin access history
      </h2>

      <div v-if="isLoadingInvites" class="text-center py-10">
        <Loader2 class="w-8 h-8 mx-auto text-blue-600 animate-spin" />
      </div>

      <div v-else-if="invites.length === 0" class="text-center py-10 text-gray-500">
        <Mail class="w-10 h-10 mx-auto text-gray-300 mb-2" />
        No admin access has been granted yet.
      </div>

      <div v-else class="divide-y">
        <div
          v-for="invite in invites"
          :key="invite.id"
          class="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
        >
          <div>
            <p class="font-medium">{{ invite.email }}</p>
            <p class="text-xs text-gray-500">
              {{ invite.kind === 'invited' ? 'Invited as a new account' : 'Existing account promoted' }}
              by {{ invite.invited_by?.email || 'unknown' }}
            </p>
          </div>

          <p class="text-sm text-gray-400 whitespace-nowrap">
            {{ new Date(invite.created_at).toLocaleString() }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
