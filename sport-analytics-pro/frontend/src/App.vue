<template>
  <div class="min-h-screen bg-[#0d1117] text-white flex flex-col">
    <!-- Navigation -->
    <nav class="bg-[#161b22] border-b border-[#30363d] sticky top-0 z-40">
      <div class="max-w-6xl mx-auto px-4 py-2.5">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <router-link to="/" class="flex items-center gap-2 group">
            <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-black text-white shadow-md group-hover:shadow-blue-600/30 transition-all">
              SA
            </div>
            <span class="text-base font-bold text-white hidden sm:block">
              Sport Analytics
            </span>
          </router-link>

          <!-- Navigation links -->
          <div class="flex items-center gap-1">
            <router-link
              to="/matches"
              class="px-3 py-1.5 rounded-md text-sm font-medium transition-all"
              :class="$route.path === '/matches'
                ? 'bg-[#30363d] text-white'
                : 'text-slate-400 hover:text-white hover:bg-[#30363d]/50'"
            >
              <span class="hidden sm:inline">Matchs</span>
              <span class="sm:hidden text-base">&#128197;</span>
            </router-link>

            <router-link
              v-if="authStore.isAuthenticated"
              to="/history"
              class="px-3 py-1.5 rounded-md text-sm font-medium transition-all"
              :class="$route.path === '/history'
                ? 'bg-[#30363d] text-white'
                : 'text-slate-400 hover:text-white hover:bg-[#30363d]/50'"
            >
              <span class="hidden sm:inline">Historique</span>
              <span class="sm:hidden text-base">&#128220;</span>
            </router-link>
          </div>

          <!-- User menu -->
          <div class="flex items-center gap-2">
            <template v-if="authStore.isAuthenticated">
              <span
                class="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                :class="{
                  'bg-blue-500/20 text-blue-400': authStore.userPlan === 'enterprise',
                  'bg-blue-500/20 text-blue-400': authStore.userPlan === 'pro',
                  'bg-[#30363d] text-slate-400': authStore.userPlan === 'free'
                }"
              >
                {{ authStore.userPlan }}
              </span>

              <div class="relative">
                <button
                  @click="showUserMenu = !showUserMenu"
                  class="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-[#30363d] transition-all"
                >
                  <div class="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold">
                    {{ userInitials }}
                  </div>
                  <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div
                  v-if="showUserMenu"
                  class="absolute right-0 mt-1 w-44 bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl py-1 z-50"
                >
                  <div class="px-3 py-2 text-xs text-slate-400 border-b border-[#30363d]">
                    {{ authStore.user?.name }}
                  </div>
                  <router-link
                    to="/profile"
                    class="block px-3 py-2 text-sm text-slate-300 hover:bg-[#30363d] hover:text-white transition-colors"
                    @click="showUserMenu = false"
                  >
                    Mon profil
                  </router-link>
                  <router-link
                    to="/history"
                    class="block px-3 py-2 text-sm text-slate-300 hover:bg-[#30363d] hover:text-white transition-colors sm:hidden"
                    @click="showUserMenu = false"
                  >
                    Historique
                  </router-link>
                  <div class="border-t border-[#30363d] my-1"></div>
                  <button
                    @click="logout"
                    class="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-[#30363d] transition-colors"
                  >
                    Deconnexion
                  </button>
                </div>
              </div>
            </template>

            <template v-else>
              <router-link
                to="/login"
                class="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Connexion
              </router-link>
              <router-link
                to="/register"
                class="text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-md font-medium text-white transition-colors"
              >
                S'inscrire
              </router-link>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main class="flex-1">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Footer -->
    <footer class="bg-[#161b22] border-t border-[#30363d] py-4">
      <div class="max-w-6xl mx-auto px-4 text-center text-slate-500 text-xs">
        &copy; 2024 Sport Analytics Pro
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRouter, useRoute } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const showUserMenu = ref(false)

onMounted(() => {
  if (authStore.isAuthenticated && route.path === '/analysis') {
    router.replace('/matches')
  }
})

watch(() => route.path, (newPath) => {
  if (authStore.isAuthenticated && newPath === '/analysis') {
    router.replace('/matches')
  }
})

watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth && route.path === '/analysis') {
    router.replace('/matches')
  }
})

const userInitials = computed(() => {
  if (!authStore.user?.name) return '?'
  return authStore.user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const logout = async () => {
  showUserMenu.value = false
  await authStore.logout()
  router.push('/')
}

window.addEventListener('click', (e) => {
  if (!e.target.closest('.relative')) {
    showUserMenu.value = false
  }
})
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
