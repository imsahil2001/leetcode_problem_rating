<template>
  <div class="dashboard-container">
    <!-- TOP HEADER -->
    <div class="header-section">
      <div>
        <h1 class="page-title">Problem Set</h1>
        <p class="page-subtitle">
          Browse and filter competitive programming challenges
        </p>
      </div>

      <div class="header-actions">
        <div class="problem-badge">
          <span class="dot"></span>
          {{ filterProblemSet.length }} Problems Available
        </div>

        <div class="auth-section">
          <template v-if="currentUser">
            <div class="user-profile">
              <div class="avatar">{{ getInitials(currentUser.email) }}</div>
              <span class="user-email">{{ currentUser.email }}</span>
              <button class="logout-btn" @click="handleLogout" title="Logout">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          </template>
          <template v-else>
            <el-button
              type="primary"
              size="small"
              @click="
                showAuthModal = true;
                isLogin = true;
              "
            >
              Login
            </el-button>
          </template>
        </div>
      </div>
    </div>

    <!-- MODERN FILTER BAR -->
    <div class="filter-bar">
      <div class="filter-group flex-2">
        <label>SEARCH KEYWORDS</label>
        <el-input
          placeholder="🔍 Search by title, ID, or pattern..."
          v-model="keyword"
          @keyup.enter="query(true)"
          class="custom-input"
        />
      </div>

      <div class="filter-group flex-1">
        <label>CONTEST ID</label>
        <el-input
          placeholder="# e.g. 383"
          v-model="contestIndex"
          @keyup.enter="query(true)"
          class="custom-input"
        />
      </div>

      <div class="filter-group flex-1">
        <label>RATING RANGE</label>
        <div class="range-wrapper">
          <el-input-number
            v-model="left"
            :min="0"
            :max="9999"
            :controls="false"
            placeholder="MIN"
            class="range-input"
            @keyup.enter="query(true)"
          />
          <span class="range-separator">-</span>
          <el-input-number
            v-model="right"
            :min="0"
            :max="9999"
            :controls="false"
            placeholder="MAX"
            class="range-input"
            @keyup.enter="query(true)"
          />
        </div>
      </div>

      <div class="filter-group action-group">
        <el-button class="btn-reset" @click="reset">
          ↺ Reset Filters
        </el-button>
      </div>
    </div>

    <!-- CLEAN TABLE -->
    <div class="table-container">
      <el-table
        :data="problemSetShow"
        style="width: 100%"
        class="modern-table"
        @sort-change="sortChange"
        :default-sort="{ prop: 'ID', order: 'descending' }"
        :row-class-name="
          ({ row }) => (solvedProblems[row.ID] ? 'solved-row' : '')
        "
      >
        <!-- Checkbox Column -->
        <el-table-column width="50" align="center">
          <template #header>
            <el-checkbox disabled />
          </template>
          <template #default="scope">
            <el-checkbox
              :model-value="!!solvedProblems[scope.row.ID]"
              @change="toggleProblem(scope.row)"
            />
          </template>
        </el-table-column>

        <el-table-column prop="ID" label="ID" width="100" sortable="custom" />

        <el-table-column label="TITLE" min-width="300">
          <template #default="scope">
            <el-link
              :href="
                locale === 'zh'
                  ? scope.row.ProblemHrefZH
                  : scope.row.ProblemHrefEN
              "
              target="_blank"
              class="problem-link"
            >
              {{ locale === "zh" ? scope.row.TitleZH : scope.row.Title }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column label="CONTEST" width="180">
          <template #default="scope">
            <el-link
              :href="
                locale === 'zh'
                  ? scope.row.ContestHrefZH
                  : scope.row.ContestHrefEN
              "
              target="_blank"
              class="contest-link"
            >
              {{
                locale === "zh"
                  ? scope.row.ContestID_zh
                  : scope.row.ContestID_en
              }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column
          prop="ProblemIndex"
          label="#"
          width="80"
          align="center"
        />

        <!-- RATING COLUMN WITH PROGRESS BAR -->
        <el-table-column
          label="RATING"
          prop="Rating"
          sortable="custom"
          width="180"
          align="right"
        >
          <template #default="scope">
            <div class="rating-cell">
              <span
                class="rating-number"
                :style="{ color: getRatingColor(scope.row.Rating) }"
              >
                {{ formatNumber(scope.row.Rating) }}
              </span>
              <div class="rating-bar-bg">
                <div
                  class="rating-bar-fill"
                  :style="{
                    width: getRatingPercentage(scope.row.Rating) + '%',
                    backgroundColor: getRatingColor(scope.row.Rating),
                  }"
                ></div>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- PAGINATION (STICKY FOOTER) -->
    <div class="footer-pagination">
      <div
        style="
          display: flex;
          align-items: center;
          width: 100%;
          justify-content: space-between;
        "
      >
        <div class="language" style="width: auto">
          <el-dropdown @command="switchLocale">
            <span
              class="el-dropdown-link"
              style="cursor: pointer; color: #6b7280; font-weight: 500"
            >
              {{ $t("lang") }}
              <el-icon class="el-icon--right">
                <arrow-down />
              </el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :command="'en'">English</el-dropdown-item>
                <el-dropdown-item :command="'zh'">简体中文</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <el-pagination
          :page-sizes="[10, 15, 20, 30, 40, 50, 100]"
          v-model:page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filterProblemSet.length"
          v-model:current-page="currentPage"
          @current-change="currentChange"
          @size-change="sizeChange"
        />
      </div>
    </div>

    <!-- Auth Modal -->
    <el-dialog
      v-model="showAuthModal"
      :title="isLogin ? 'Login to Sync' : 'Create Account'"
      width="350px"
      center
    >
      <el-input
        v-model="email"
        placeholder="Email Address"
        style="margin-bottom: 15px"
      />
      <el-input
        v-model="password"
        type="password"
        placeholder="Password"
        show-password
        style="margin-bottom: 20px"
      />
      <el-button type="primary" class="full-width-btn" @click="handleAuth">
        {{ isLogin ? "Login" : "Sign Up" }}
      </el-button>
      <div style="text-align: center; margin-top: 15px">
        <el-link type="info" @click="isLogin = !isLogin">
          {{
            isLogin
              ? "Need an account? Sign up"
              : "Already have an account? Login"
          }}
        </el-link>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { reactive, onMounted, ref, watch } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface Problem {
  ContestID_en: string;
  ContestID_zh: string;
  ContestSlug: string;
  ID: number;
  ProblemIndex: string;
  Rating: number;
  Title: string;
  TitleSlug: string;
  TitleZH: string;
  ProblemHrefZH: string | null;
  ProblemHrefEN: string | null;
  ContestHrefEN: string | null;
  ContestHrefZH: string | null;
}

interface SortPayload {
  prop: "Rating" | "ID" | null;
  order: string | null;
}

interface SortInfo {
  prop: "Rating" | "ID";
  order: string;
}

const currentUser = ref<User | null>(null);
const showAuthModal = ref(false);
const isLogin = ref(true);
const email = ref("");
const password = ref("");
const solvedProblems = ref<Record<string | number, boolean>>({});

const getInitials = (userEmail: string | null) => {
  if (!userEmail) return "U";
  const namePart = userEmail.split("@")[0];
  const splitChars = namePart.split(/[._-]/);
  if (splitChars.length >= 2) {
    return (splitChars[0][0] + splitChars[1][0]).toUpperCase();
  }
  return namePart.substring(0, 2).toUpperCase();
};

const getRatingColor = (rating: number) => {
  if (rating < 1750) return "#10b981";
  if (rating < 2000) return "#f59e0b";
  return "#ef4444";
};

const getRatingPercentage = (rating: number) => {
  const min = 1200;
  const max = 2500;
  let percentage = ((rating - min) / (max - min)) * 100;
  if (percentage < 5) percentage = 5;
  if (percentage > 100) percentage = 100;
  return percentage;
};

const syncToCloud = async () => {
  if (!currentUser.value) return;
  try {
    await setDoc(
      doc(db, "users", currentUser.value.uid),
      {
        solved: solvedProblems.value,
        config: {
          currentPage: currentPage.value,
          pageSize: pageSize.value,
          left: left.value,
          right: right.value,
          keyword: keyword.value,
          contestIndex: contestIndex.value,
        },
      },
      { merge: true }
    );
  } catch (e) {
    console.error("Error syncing", e);
  }
};

const loadFromCloud = async (uid: string) => {
  try {
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.solved) solvedProblems.value = data.solved;

      if (data.config) {
        if (data.config.pageSize) pageSize.value = data.config.pageSize;
        if (data.config.left !== undefined) left.value = data.config.left;
        if (data.config.right !== undefined) right.value = data.config.right;
        if (data.config.keyword) keyword.value = data.config.keyword;
        if (data.config.contestIndex !== undefined)
          contestIndex.value = data.config.contestIndex;

        query(false);

        if (data.config.currentPage) {
          currentPage.value = data.config.currentPage;
        }
        currentChange();
      }
    }
  } catch (e) {
    console.error("Error loading", e);
  }
};

const toggleProblem = (row: Problem) => {
  if (!currentUser.value) {
    ElMessage.warning("Login to save progress!");
    solvedProblems.value[row.ID] = false;
    return;
  }
  solvedProblems.value[row.ID] = !solvedProblems.value[row.ID];
  syncToCloud();
};

const handleAuth = async () => {
  try {
    if (isLogin.value) {
      await signInWithEmailAndPassword(auth, email.value, password.value);
      ElMessage.success("Logged in successfully!");
    } else {
      await createUserWithEmailAndPassword(auth, email.value, password.value);
      ElMessage.success("Account created successfully!");
    }
    showAuthModal.value = false;
    email.value = "";
    password.value = "";
  } catch (error: unknown) {
    if (error instanceof Error) ElMessage.error(error.message);
    else ElMessage.error(String(error));
  }
};

const handleLogout = async () => {
  await signOut(auth);
  solvedProblems.value = {};
  ElMessage.success("Logged out");
};

const url = "./data.json";
let i18n = useI18n();
let locale = i18n.locale;
let left = ref<number | null>(null);
let right = ref<number | null>(null);
let contestIndex = ref<number | null>(null);

let sortInfo = reactive<SortInfo>({
  prop: "ID",
  order: "descending",
});

const pageSizeCache = localStorage.getItem("pageSize");
let pageSize = ref(pageSizeCache ? parseInt(pageSizeCache) : 15);
const problemSetAll: Array<Problem> = reactive([]);
const problemSetShow: Array<Problem> = reactive([]);
const filterProblemSet: Array<Problem> = reactive([]);
let keyword = ref("");
let currentPage = ref(1);

watch(
  [currentPage, pageSize, left, right, keyword, contestIndex],
  () => {
    syncToCloud();
  },
  { deep: true }
);

onMounted(async () => {
  try {
    const res = await axios.get(url);
    const problems = res.data;
    problems.forEach((item: Problem) => {
      item.ProblemHrefZH = "https://leetcode.cn/problems/" + item.TitleSlug;
      item.ProblemHrefEN = "https://leetcode.com/problems/" + item.TitleSlug;
      item.ContestHrefZH = "https://leetcode.cn/contest/" + item.ContestSlug;
      item.ContestHrefEN = "https://leetcode.com/contest/" + item.ContestSlug;
      problemSetAll.push(item);
      filterProblemSet.push(item);
    });
    query(true);

    onAuthStateChanged(auth, (user) => {
      currentUser.value = user;
      if (user) loadFromCloud(user.uid);
    });
  } catch (error) {
    console.error("Error loading data", error);
  }
});

function sortChange(s: SortPayload) {
  if (s.prop == null || s.order == null) {
    sortInfo.order = "descending";
    sortInfo.prop = "ID";
  } else {
    sortInfo.order = s.order;
    sortInfo.prop = s.prop;
  }
  query(true);
}

function switchLocale(selectedLocale: string) {
  i18n.locale.value = selectedLocale;
  localStorage.setItem("locale", selectedLocale);
}

function formatNumber(rating: number) {
  return Math.round(rating);
}

function currentChange() {
  problemSetShow.length = 0;
  let no = currentPage.value;
  let size = pageSize.value;
  let total = filterProblemSet.length;
  for (let i = (no - 1) * size; i < Math.min(total, no * size); i++) {
    problemSetShow.push(filterProblemSet[i]);
  }
}

function sizeChange() {
  currentPage.value = 1;
  localStorage.setItem("pageSize", String(pageSize.value));
  currentChange();
}

function query(payload?: unknown) {
  const shouldResetPage = typeof payload === "boolean" ? payload : true;

  if (left.value != null && right.value != null && right.value < left.value) {
    ElMessage.error({ message: "Min must be less than Max", duration: 1000 });
    return;
  }

  filterProblemSet.length = 0;
  problemSetAll.forEach((item) => {
    if (keyword.value.trim().length > 0) {
      let k = keyword.value.trim().toLowerCase();
      if (
        !item.TitleZH.toLowerCase().includes(k) &&
        !item.Title.toLowerCase().includes(k) &&
        !item.TitleSlug.toLowerCase().includes(k) &&
        !String(item.ID).includes(k)
      ) {
        return;
      }
    }
    if (contestIndex.value != null) {
      let index = parseInt(item.ContestSlug.replace(/\D/gi, ""));
      if (index != contestIndex.value) return;
    }
    if (left.value != null && Math.round(item.Rating) < left.value) return;
    if (right.value != null && Math.round(item.Rating) > right.value) return;
    filterProblemSet.push(item);
  });

  filterProblemSet.sort((a: Problem, b: Problem) => {
    if (sortInfo.order === "descending") {
      return (b[sortInfo.prop] as number) - (a[sortInfo.prop] as number);
    } else {
      return (a[sortInfo.prop] as number) - (b[sortInfo.prop] as number);
    }
  });

  if (shouldResetPage) {
    currentPage.value = 1;
  }

  currentChange();
}

function reset() {
  keyword.value = "";
  contestIndex.value = null;
  left.value = null;
  right.value = null;
  sortInfo.order = "descending";
  sortInfo.prop = "ID";
  query(true);
}
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");

.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Helvetica, Arial, sans-serif;
}

/* Header */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
}
.page-title {
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  margin: 0;
}
.page-subtitle {
  color: #6b7280;
  font-size: 14px;
  margin: 4px 0 0 0;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}
.problem-badge {
  background-color: #f3e8ff;
  color: #6b21a8;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}
.problem-badge .dot {
  width: 6px;
  height: 6px;
  background-color: #9333ea;
  border-radius: 50%;
}

/* NEW: User Profile Pill Design */
.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 4px 4px;
  border-radius: 30px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #111827;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
}
.user-email {
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
  margin-right: 4px;
}
.logout-btn {
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
}
.logout-btn:hover {
  color: #ef4444;
  background-color: #fee2e2;
}

/* Filters */
.filter-bar {
  display: flex;
  gap: 20px;
  align-items: flex-end;
  background: #ffffff;
  margin-bottom: 20px;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.flex-2 {
  flex: 2;
}
.flex-1 {
  flex: 1;
}
.filter-group label {
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  letter-spacing: 0.05em;
}
.range-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}
.range-separator {
  color: #9ca3af;
}
.range-input {
  width: 100%;
}
.btn-reset {
  background-color: #111827 !important;
  color: #ffffff !important;
  border-radius: 8px;
  height: 32px;
  font-weight: 600;
  padding: 0 20px;
  border: none;
}
.btn-reset:hover {
  background-color: #374151 !important;
}

/* Table */
.table-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}
:deep(.modern-table th.el-table__cell) {
  background-color: #f9fafb !important;
  color: #6b7280;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;
}
:deep(.modern-table td.el-table__cell) {
  border-bottom: 1px solid #f3f4f6;
  padding: 12px 0;
}
:deep(.modern-table::before) {
  display: none;
}
.problem-link {
  font-weight: 600;
  color: #111827;
}
.contest-link {
  color: #6b7280;
  font-size: 13px;
}

/* Rating Bar */
.rating-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}
.rating-number {
  font-weight: 700;
  font-size: 14px;
}
.rating-bar-bg {
  width: 60px;
  height: 6px;
  background-color: #f3f4f6;
  border-radius: 3px;
  overflow: hidden;
}
.rating-bar-fill {
  height: 100%;
  border-radius: 3px;
}

/* Solved State */
:deep(.solved-row td.el-table__cell) {
  background-color: #f8fafc !important;
  opacity: 0.6;
}
:deep(.solved-row .problem-link) {
  text-decoration: line-through;
  color: #9ca3af;
}

/* NEW: Sticky Footer */
.footer-pagination {
  position: sticky;
  bottom: 0;
  background-color: #ffffff;
  padding: 15px 20px;
  margin-top: 20px;
  z-index: 20;
  border-top: 1px solid #e5e7eb;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.05);
}
.full-width-btn {
  width: 100%;
}
</style>
