import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
  useUser,
} from '@clerk/react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import {
  BarChart3,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Bus,
  CircleDollarSign,
  Download,
  Droplets,
  Gamepad2,
  Gift,
  GraduationCap,
  HandCoins,
  HeartPulse,
  House,
  Landmark,
  Lightbulb,
  Moon,
  Plus,
  Receipt,
  ShoppingCart,
  Sun,
  Tag,
  Target,
  TrendingDown,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  Wifi,
  X,
  CalendarDays,
  Crown,
  LayoutDashboard,
  LineChart,
  Pencil,
  Repeat,
  Search,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { Button } from './components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './components/ui/card'
import { createSupabaseClientWithClerkToken } from './lib/supabase'
import { cn } from './lib/utils'
import authBackground from '../assets/controle-financeiro-clinica-fisioterapia.jpg'
import cardBackground from '../assets/finance-background-utqgb7jd02d72akj.jpg'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type TransactionType = 'receita' | 'despesa'
type ThemeMode = 'light' | 'dark'
type RecurringFrequency = 'semanal' | 'quinzenal' | 'mensal' | 'anual'
type PaymentMethod = 'pix' | 'cartao'
type CardProvider =
  | 'itau'
  | 'banco_do_brasil'
  | 'pan'
  | 'nubank'
  | 'mercado_pago'
  | 'c6'
  | 'santander'
  | 'bradesco'
  | 'picpay'
type InvestmentType =
  | 'acoes'
  | 'criptomoedas'
  | 'fiis'
  | 'renda_fixa'
  | 'fundos'
  | 'outros'

interface CategoryDef {
  key: string
  label: string
  emoji: string
  iconKey?: string
  icon?: LucideIcon
  type: TransactionType
}

interface CustomTheme {
  id: string
  name: string
  primaryColor: string
  accentColor: string
  navFrom: string
  navVia: string
  navTo: string
  createdAt: string
}

interface FinancialGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  createdAt: string
}

interface MonthlyPlan {
  id: string
  name: string
  monthKey: string
  plannedAmount: number
  categoryKey: string
  createdAt: string
}

interface RecurringTransaction {
  id: string
  name: string
  type: TransactionType
  categoryKey: string
  amount: number
  frequency: RecurringFrequency
  nextDueDate: string
  isActive: boolean
  paymentMethod: PaymentMethod | null
  cardProvider: CardProvider | null
  description: string
  createdAt: string
}

interface InvestmentPosition {
  id: string
  name: string
  type: InvestmentType
  investedAmount: number
  currentValue: number
  startDate: string
  notes: string
  isActive: boolean
  createdAt: string
}

interface Transaction {
  id: string
  groupId: string
  type: TransactionType
  date: string
  value: number
  categoryKey: string
  categoryLabel: string
  description: string
  installmentNumber: number
  installmentCount: number
  firstInstallmentDate: string
  paymentMethod: PaymentMethod | null
  cardProvider: CardProvider | null
  createdAt: string
}

type SummaryTypeFilter = 'todos' | TransactionType | 'recorrentes'

interface DashboardEntry {
  id: string
  source: 'transacao' | 'recorrente'
  sourceId: string
  type: TransactionType
  date: string
  value: number
  categoryKey: string
  categoryLabel: string
  description: string
  installmentNumber: number
  installmentCount: number
  paymentMethod: PaymentMethod | null
  cardProvider: CardProvider | null
  recurringFrequency?: RecurringFrequency
}

interface TransactionFormState {
  type: TransactionType
  date: string
  value: string
  categoryKey: string
  description: string
  isInstallment: boolean
  installmentCount: number
  paymentMethod: '' | PaymentMethod
  cardProvider: '' | CardProvider
}

interface DbTransactionRow {
  id: string
  group_id: string
  type: TransactionType
  category_key: string
  category_label: string
  description: string | null
  amount: number | string
  entry_date: string
  first_installment_date: string
  installment_number: number
  installment_count: number
  payment_method?: PaymentMethod | null
  card_provider?: CardProvider | null
  created_at: string
}

interface DbGoalRow {
  id: string
  name: string
  target_amount: number | string
  current_amount: number | string
  target_date: string
  created_at: string
}

interface DbRecurringRow {
  id: string
  name: string
  type: TransactionType
  category_key: string
  amount: number | string
  frequency: RecurringFrequency
  next_due_date: string
  is_active: boolean
  payment_method?: PaymentMethod | null
  card_provider?: CardProvider | null
  description: string | null
  created_at: string
}

interface DbInvestmentRow {
  id: string
  name: string
  type: InvestmentType
  invested_amount: number | string
  current_value: number | string
  start_date: string
  notes: string | null
  is_active: boolean
  created_at: string
}

interface DbUserCategoryRow {
  id: string
  type: TransactionType
  label: string
  emoji: string
  icon_key: string | null
  is_active: boolean
  created_at: string
}

interface DbUserThemeRow {
  id: string
  name: string
  primary_color: string
  accent_color: string
  nav_from: string
  nav_via: string
  nav_to: string
  is_active: boolean
  created_at: string
}

type DbContext = {
  db: ReturnType<typeof createSupabaseClientWithClerkToken>
  appUserId: string
}

interface DashboardPageProps {
  transactions: Transaction[]
  categories: CategoryDef[]
  goals: FinancialGoal[]
  onOpenAdd: () => void
  onEditTransaction: (transaction: Transaction) => void
  onDeleteTransaction: (transactionId: string) => void | Promise<void>
  onCreateCategory: (input: {
    type: TransactionType
    emoji: string
    label: string
    iconKey?: string
  }) => void | Promise<void>
  onCreateGoal: (input: { name: string; targetAmount: number; targetDate: string }) => void
  onUpdateGoal: (goal: FinancialGoal) => void
  onDeleteGoal: (goalId: string) => void
  onAddGoalAmount: (goalId: string, amount: number) => void
  themeMode: ThemeMode
  onToggleThemeMode: () => void
  themePresets: CustomTheme[]
  activeThemeId: string
  onCreateTheme: (input: Omit<CustomTheme, 'id' | 'createdAt'>) => void | Promise<void>
  onApplyTheme: (themeId: string) => void | Promise<void>
  onDeleteTheme: (themeId: string) => void | Promise<void>
  getDbContext: () => Promise<DbContext | null>
}

interface AddTransactionModalProps {
  categories: CategoryDef[]
  onClose: () => void
  onSubmit: (form: TransactionFormState) => void
}

interface EditTransactionModalProps {
  categories: CategoryDef[]
  transaction: Transaction
  onClose: () => void
  onSubmit: (
    id: string,
    form: Omit<TransactionFormState, 'isInstallment' | 'installmentCount'>,
  ) => void
}

type DashboardSectionKey =
  | 'resumo'
  | 'categorias'
  | 'metas'
  | 'planejamento'
  | 'recorrentes'
  | 'investimentos'
  | 'relatorios'
  | 'premium'
  | 'configuracoes'

interface DashboardSectionDef {
  key: DashboardSectionKey
  label: string
  icon: LucideIcon
}

const dashboardSections: DashboardSectionDef[] = [
  { key: 'resumo', label: 'Resumo', icon: LayoutDashboard },
  { key: 'metas', label: 'Metas', icon: Target },
  { key: 'planejamento', label: 'Planejamento', icon: CalendarDays },
  { key: 'recorrentes', label: 'Recorrentes', icon: Repeat },
  { key: 'investimentos', label: 'Investimentos', icon: LineChart },
  { key: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  { key: 'categorias', label: 'Personalização', icon: Tag },
  { key: 'premium', label: 'Premium', icon: Crown },
]
const incomeCategories: CategoryDef[] = [
  { key: 'salario', label: 'Salario', emoji: '💼', icon: Briefcase, type: 'receita' },
  { key: 'freela', label: 'Freela', emoji: '📄', icon: HandCoins, type: 'receita' },
  { key: 'mesada', label: 'Mesada', emoji: '👛', icon: Wallet, type: 'receita' },
  { key: 'bonus', label: 'Bonus', emoji: '🎁', icon: Gift, type: 'receita' },
  { key: 'investimentos', label: 'Investimentos', emoji: '📈', icon: Landmark, type: 'receita' },
  { key: 'reembolso', label: 'Reembolso', emoji: '💳', icon: Receipt, type: 'receita' },
  { key: 'outros_receita', label: 'Outros', emoji: '💰', icon: CircleDollarSign, type: 'receita' },
]

const expenseCategories: CategoryDef[] = [
  { key: 'transporte', label: 'Transporte', emoji: '🚌', icon: Bus, type: 'despesa' },
  { key: 'lazer', label: 'Lazer', emoji: '🎮', icon: Gamepad2, type: 'despesa' },
  { key: 'comida', label: 'Comida', emoji: '🍽️', icon: UtensilsCrossed, type: 'despesa' },
  { key: 'luz', label: 'Conta de luz', emoji: '💡', icon: Lightbulb, type: 'despesa' },
  { key: 'agua', label: 'Conta de agua', emoji: '💧', icon: Droplets, type: 'despesa' },
  { key: 'aluguel', label: 'Aluguel', emoji: '🏠', icon: House, type: 'despesa' },
  { key: 'internet', label: 'Internet', emoji: '📶', icon: Wifi, type: 'despesa' },
  { key: 'saude', label: 'Saude', emoji: '❤️', icon: HeartPulse, type: 'despesa' },
  { key: 'educacao', label: 'Educacao', emoji: '🎓', icon: GraduationCap, type: 'despesa' },
  { key: 'compras', label: 'Compras', emoji: '🛒', icon: ShoppingCart, type: 'despesa' },
  { key: 'outros_despesa', label: 'Outros', emoji: '📦', icon: Receipt, type: 'despesa' },
]

const transactionsStorageKey = 'poupe-bem-transactions-v2'
const themeStorageKey = 'poupe-bem-theme-v1'
const customCategoriesStorageKey = 'poupe-bem-custom-categories-v1'
const customThemesStorageKey = 'poupe-bem-custom-themes-v1'
const activeThemeStorageKey = 'poupe-bem-active-theme-v1'
const goalsStorageKey = 'poupe-bem-goals-v1'
const monthlyPlansStorageKey = 'poupe-bem-monthly-plans-v1'
const recurringTransactionsStorageKey = 'poupe-bem-recurring-v1'
const investmentPositionsStorageKey = 'poupe-bem-investments-v1'
const investmentTypeOptions: Array<{ value: InvestmentType; label: string; emoji: string }> = [
  { value: 'acoes', label: 'Ações', emoji: '📈' },
  { value: 'criptomoedas', label: 'Criptomoedas', emoji: '🪙' },
  { value: 'fiis', label: 'FIIs', emoji: '🏢' },
  { value: 'renda_fixa', label: 'Renda fixa', emoji: '🧾' },
  { value: 'fundos', label: 'Fundos', emoji: '💼' },
  { value: 'outros', label: 'Outros', emoji: '📊' },
]
const summaryMonthOptions = [
  { value: '01', label: 'Jan' },
  { value: '02', label: 'Fev' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Abr' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Ago' },
  { value: '09', label: 'Set' },
  { value: '10', label: 'Out' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dez' },
] as const
const reportPalette = ['#ff7b82', '#62d6d6', '#67a6ff', '#9bd7b5', '#f6b870', '#bfa2ff']
const annualPalette = ['#22c55e', '#ef4444', '#3b82f6']
const cardProviderOptions: Array<{
  value: CardProvider
  label: string
  emoji: string
  colorClass: string
}> = [
  { value: 'itau', label: 'Itaú', emoji: '🟧', colorClass: 'text-orange-500' },
  {
    value: 'banco_do_brasil',
    label: 'Banco do Brasil',
    emoji: '🟨',
    colorClass: 'text-yellow-500',
  },
  { value: 'pan', label: 'Pan', emoji: '🟦', colorClass: 'text-sky-500' },
  { value: 'nubank', label: 'Nubank', emoji: '🟪', colorClass: 'text-purple-500' },
  {
    value: 'mercado_pago',
    label: 'Mercado Pago',
    emoji: '🔵',
    colorClass: 'text-blue-500',
  },
  { value: 'c6', label: 'C6', emoji: '⚫', colorClass: 'text-zinc-500 dark:text-zinc-300' },
  {
    value: 'santander',
    label: 'Santander',
    emoji: '🔴',
    colorClass: 'text-rose-500',
  },
  {
    value: 'bradesco',
    label: 'Bradesco',
    emoji: '🟥',
    colorClass: 'text-red-500',
  },
  { value: 'picpay', label: 'PicPay', emoji: '🟩', colorClass: 'text-emerald-500' },
]
const categoryEmojiSuggestions = [
  '💡',
  '🏖️',
  '🚗',
  '🎬',
  '🧾',
  '🍕',
  '🧠',
  '📚',
  '🛍️',
  '💊',
  '🐶',
  '🛠️',
]
const defaultThemePreset: CustomTheme = {
  id: 'default-theme',
  name: 'Azul Padrão',
  primaryColor: '#89a6ff',
  accentColor: '#10b981',
  navFrom: '#1a2f66',
  navVia: '#132852',
  navTo: '#0f1f43',
  createdAt: new Date().toISOString(),
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10)
}

function getCategoriesByType(type: TransactionType, categories: CategoryDef[]) {
  return categories.filter((category) => category.type === type)
}

function getCategoryByKey(key: string, categories: CategoryDef[]) {
  return categories.find((category) => category.key === key)
}

function getCategoryDisplaySymbol(category?: CategoryDef) {
  const emoji = category?.emoji?.trim()
  return <span>{emoji || '📌'}</span>
}

function getCategoryOptionLabel(category: CategoryDef) {
  const prefix = category.emoji?.trim() || '📌'
  return `${prefix} ${category.label}`
}

function getCardProviderOption(cardProvider: CardProvider | null | undefined) {
  if (!cardProvider) {
    return null
  }
  return (
    cardProviderOptions.find((option) => option.value === cardProvider) ?? null
  )
}

function getPaymentMethodLabel(
  paymentMethod: PaymentMethod | null,
  cardProvider: CardProvider | null,
) {
  if (paymentMethod === 'pix') {
    return 'Pix'
  }

  if (paymentMethod === 'cartao') {
    const provider = getCardProviderOption(cardProvider)
    if (provider) {
      return `${provider.emoji} ${provider.label}`
    }
    return 'Cartão'
  }

  return ''
}

function parsePaymentMethod(value: unknown): PaymentMethod | null {
  if (value === 'pix' || value === 'cartao') {
    return value
  }
  return null
}

function parseCardProvider(value: unknown): CardProvider | null {
  if (
    value === 'itau' ||
    value === 'banco_do_brasil' ||
    value === 'pan' ||
    value === 'nubank' ||
    value === 'mercado_pago' ||
    value === 'c6' ||
    value === 'santander' ||
    value === 'bradesco' ||
    value === 'picpay'
  ) {
    return value
  }
  return null
}

function getMergedCategories(customCategories: CategoryDef[]) {
  return [...incomeCategories, ...expenseCategories, ...customCategories]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${date}T12:00:00`))
}

function formatMonthLabel(monthKey: string) {
  const date = new Date(`${monthKey}-01T12:00:00`)
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' })
    .format(date)
    .replace('.', '')
}

function formatMonthTitle(monthKey: string) {
  const date = new Date(`${monthKey}-01T12:00:00`)
  const title = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date)
  return title.charAt(0).toUpperCase() + title.slice(1)
}

function formatRecurringFrequencyLabel(frequency: RecurringFrequency) {
  switch (frequency) {
    case 'semanal':
      return 'Semanal'
    case 'quinzenal':
      return 'Quinzenal'
    case 'anual':
      return 'Anual'
    case 'mensal':
    default:
      return 'Mensal'
  }
}

function getRecurringMonthlyAmount(item: RecurringTransaction) {
  switch (item.frequency) {
    case 'semanal':
      return item.amount * 4
    case 'quinzenal':
      return item.amount * 2
    case 'anual':
      return item.amount / 12
    case 'mensal':
    default:
      return item.amount
  }
}

function getInvestmentTypeLabel(type: InvestmentType) {
  return (
    investmentTypeOptions.find((option) => option.value === type)?.label ?? 'Outros'
  )
}

function getInvestmentTypeEmoji(type: InvestmentType) {
  return investmentTypeOptions.find((option) => option.value === type)?.emoji ?? '📊'
}

function getDaysRemaining(targetDate: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${targetDate}T00:00:00`)
  const diff = target.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function generateId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16)
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

function addMonths(date: Date, amount: number) {
  const result = new Date(date)
  const originalDay = result.getDate()
  result.setDate(1)
  result.setMonth(result.getMonth() + amount)
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()
  result.setDate(Math.min(originalDay, lastDay))
  return result
}

function addMonthsToMonthKey(monthKey: string, amount: number) {
  const date = new Date(`${monthKey}-01T12:00:00`)
  date.setMonth(date.getMonth() + amount)
  return date.toISOString().slice(0, 7)
}

function getNextRecurringDate(date: Date, frequency: RecurringFrequency) {
  const next = new Date(date)
  switch (frequency) {
    case 'semanal':
      next.setDate(next.getDate() + 7)
      return next
    case 'quinzenal':
      next.setDate(next.getDate() + 14)
      return next
    case 'anual':
      return addMonths(next, 12)
    case 'mensal':
    default:
      return addMonths(next, 1)
  }
}

function projectRecurringEntries(
  recurringTransactions: RecurringTransaction[],
  categories: CategoryDef[],
  startMonthKey: string,
  endMonthKey: string,
): DashboardEntry[] {
  const startBoundary = new Date(`${startMonthKey}-01T00:00:00`)
  const endBoundary = new Date(`${endMonthKey}-01T23:59:59`)
  endBoundary.setMonth(endBoundary.getMonth() + 1, 0)

  const projected: DashboardEntry[] = []

  recurringTransactions
    .filter((item) => item.isActive)
    .forEach((item) => {
      const category = getCategoryByKey(item.categoryKey, categories)
      const categoryLabel = category?.label ?? 'Sem categoria'
      let cursor = new Date(`${item.nextDueDate}T12:00:00`)
      let guard = 0

      while (cursor <= endBoundary && guard < 5000) {
        if (cursor >= startBoundary) {
          const isoDate = toIsoDate(cursor)
          projected.push({
            id: `rec-${item.id}-${isoDate}-${guard}`,
            source: 'recorrente',
            sourceId: item.id,
            type: item.type,
            date: isoDate,
            value: item.amount,
            categoryKey: item.categoryKey,
            categoryLabel,
            description: item.description.trim(),
            installmentNumber: 1,
            installmentCount: 1,
            paymentMethod: item.paymentMethod,
            cardProvider: item.cardProvider,
            recurringFrequency: item.frequency,
          })
        }

        cursor = getNextRecurringDate(cursor, item.frequency)
        guard += 1
      }
    })

  return projected
}

function toIsoDate(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    .toISOString()
    .slice(0, 10)
}

function splitAmountInInstallments(total: number, count: number) {
  const totalCents = Math.round(total * 100)
  const baseCents = Math.floor(totalCents / count)
  const remainder = totalCents - baseCents * count

  return Array.from({ length: count }, (_, index) => {
    const cents = baseCents + (index < remainder ? 1 : 0)
    return cents / 100
  })
}

function toDbTransactionRows(transactions: Transaction[], userId: string) {
  return transactions.map((item) => ({
    user_id: userId,
    group_id: item.groupId,
    type: item.type,
    category_key: item.categoryKey,
    category_label: item.categoryLabel,
    description: item.description || null,
    amount: item.value,
    entry_date: item.date,
    first_installment_date: item.firstInstallmentDate,
    installment_number: item.installmentNumber,
    installment_count: item.installmentCount,
    payment_method: item.paymentMethod,
    card_provider: item.cardProvider,
  }))
}

function mapDbTransactionRow(row: DbTransactionRow): Transaction {
  const paymentMethod = parsePaymentMethod(row.payment_method)
  const cardProvider =
    paymentMethod === 'cartao' ? parseCardProvider(row.card_provider) : null

  return {
    id: row.id,
    groupId: row.group_id,
    type: row.type,
    date: row.entry_date,
    value: Number(row.amount ?? 0),
    categoryKey: row.category_key,
    categoryLabel: row.category_label,
    description: row.description ?? '',
    installmentNumber: row.installment_number,
    installmentCount: row.installment_count,
    firstInstallmentDate: row.first_installment_date,
    paymentMethod,
    cardProvider,
    createdAt: row.created_at,
  }
}

function mapDbGoalRow(row: DbGoalRow): FinancialGoal {
  return {
    id: row.id,
    name: row.name,
    targetAmount: Number(row.target_amount ?? 0),
    currentAmount: Number(row.current_amount ?? 0),
    targetDate: row.target_date,
    createdAt: row.created_at,
  }
}

function mapDbRecurringRow(row: DbRecurringRow): RecurringTransaction {
  const paymentMethod = parsePaymentMethod(row.payment_method)
  const cardProvider =
    paymentMethod === 'cartao' ? parseCardProvider(row.card_provider) : null

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    categoryKey: row.category_key,
    amount: Number(row.amount ?? 0),
    frequency: row.frequency,
    nextDueDate: row.next_due_date,
    isActive: row.is_active,
    paymentMethod,
    cardProvider,
    description: row.description ?? '',
    createdAt: row.created_at,
  }
}

function mapDbInvestmentRow(row: DbInvestmentRow): InvestmentPosition {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    investedAmount: Number(row.invested_amount ?? 0),
    currentValue: Number(row.current_value ?? 0),
    startDate: row.start_date,
    notes: row.notes ?? '',
    isActive: row.is_active,
    createdAt: row.created_at,
  }
}

function mapDbUserCategoryRow(row: DbUserCategoryRow): CategoryDef {
  return {
    key: row.id,
    type: row.type,
    label: row.label,
    emoji: row.emoji || '📌',
    iconKey: row.icon_key ?? undefined,
  }
}

function mapDbUserThemeRow(row: DbUserThemeRow): CustomTheme {
  return {
    id: row.id,
    name: row.name,
    primaryColor: row.primary_color,
    accentColor: row.accent_color,
    navFrom: row.nav_from,
    navVia: row.nav_via,
    navTo: row.nav_to,
    createdAt: row.created_at,
  }
}

function buildChartData(entries: Array<{ date: string; type: TransactionType; value: number }>) {
  const monthMap = new Map<
    string,
    { monthKey: string; mes: string; receitas: number; despesas: number }
  >()

  entries.forEach((entry) => {
    const monthKey = entry.date.slice(0, 7)
    const existing = monthMap.get(monthKey) ?? {
      monthKey,
      mes: new Intl.DateTimeFormat('pt-BR', { month: 'short' })
        .format(new Date(`${monthKey}-01T12:00:00`))
        .replace('.', ''),
      receitas: 0,
      despesas: 0,
    }

    if (entry.type === 'receita') {
      existing.receitas += entry.value
    } else {
      existing.despesas += entry.value
    }

    monthMap.set(monthKey, existing)
  })

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - i)
    const monthKey = date.toISOString().slice(0, 7)

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        monthKey,
        mes: new Intl.DateTimeFormat('pt-BR', { month: 'short' })
          .format(new Date(`${monthKey}-01T12:00:00`))
          .replace('.', ''),
        receitas: 0,
        despesas: 0,
      })
    }
  }

  return Array.from(monthMap.values())
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .map((item) => ({
      ...item,
      mes: item.mes.charAt(0).toUpperCase() + item.mes.slice(1),
    }))
}

function readStoredTransactions() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(transactionsStorageKey)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((item) => {
        const categoryKey = String(item.categoryKey ?? '')
        const type =
          item.type === 'receita' || item.type === 'despesa'
            ? item.type
            : undefined

        if (!type) {
          return null
        }

        const paymentMethod = parsePaymentMethod(item.paymentMethod)
        const cardProvider = parseCardProvider(item.cardProvider)
        const normalizedCardProvider =
          paymentMethod === 'cartao' ? cardProvider : null

        return {
          id: String(item.id ?? generateId()),
          groupId: String(item.groupId ?? generateId()),
          type,
          date: String(item.date ?? getTodayDate()),
          value: Number(item.value ?? 0),
          categoryKey,
          categoryLabel: String(item.categoryLabel ?? categoryKey ?? 'Sem categoria'),
          description: String(item.description ?? ''),
          installmentNumber: Number(item.installmentNumber ?? 1),
          installmentCount: Number(item.installmentCount ?? 1),
          firstInstallmentDate: String(item.firstInstallmentDate ?? String(item.date ?? getTodayDate())),
          paymentMethod,
          cardProvider: normalizedCardProvider,
          createdAt: String(item.createdAt ?? new Date().toISOString()),
        } satisfies Transaction
      })
      .filter((item): item is Transaction => {
        if (!item) {
          return false
        }
        return item.value > 0
      })
  } catch {
    return []
  }
}

function readStoredCustomCategories() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(customCategoriesStorageKey)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((item): CategoryDef | null => {
        const type =
          item.type === 'receita' || item.type === 'despesa'
            ? item.type
            : undefined

        if (!type) {
          return null
        }

        const key = String(item.key ?? '').trim()
        const label = String(item.label ?? '').trim()
        const emoji = String(item.emoji ?? '').trim()
        if (!key || !label || !emoji) {
          return null
        }

        return {
          key,
          label,
          emoji,
          type,
        }
      })
      .filter((item): item is CategoryDef => item !== null)
  } catch {
    return []
  }
}

function isHexColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value)
}

function readStoredThemes() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(customThemesStorageKey)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((item) => {
        const id = String(item.id ?? '').trim()
        const name = String(item.name ?? '').trim()
        const primaryColor = String(item.primaryColor ?? '').trim()
        const accentColor = String(item.accentColor ?? '').trim()
        const navFrom = String(item.navFrom ?? '').trim()
        const navVia = String(item.navVia ?? '').trim()
        const navTo = String(item.navTo ?? '').trim()

        if (
          !id ||
          !name ||
          !isHexColor(primaryColor) ||
          !isHexColor(accentColor) ||
          !isHexColor(navFrom) ||
          !isHexColor(navVia) ||
          !isHexColor(navTo)
        ) {
          return null
        }

        return {
          id,
          name,
          primaryColor,
          accentColor,
          navFrom,
          navVia,
          navTo,
          createdAt: String(item.createdAt ?? new Date().toISOString()),
        } satisfies CustomTheme
      })
      .filter((item): item is CustomTheme => item !== null)
  } catch {
    return []
  }
}

function getInitialActiveThemeId() {
  if (typeof window === 'undefined') {
    return defaultThemePreset.id
  }
  const stored = window.localStorage.getItem(activeThemeStorageKey)
  return stored?.trim() || defaultThemePreset.id
}

function readStoredGoals() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(goalsStorageKey)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((item) => {
        const id = String(item.id ?? '').trim()
        const name = String(item.name ?? '').trim()
        const targetAmount = Number(item.targetAmount ?? 0)
        const currentAmount = Number(item.currentAmount ?? 0)
        const targetDate = String(item.targetDate ?? '').slice(0, 10)

        if (!id || !name || !targetDate || targetAmount <= 0) {
          return null
        }

        return {
          id,
          name,
          targetAmount,
          currentAmount: Math.max(0, currentAmount),
          targetDate,
          createdAt: String(item.createdAt ?? new Date().toISOString()),
        } satisfies FinancialGoal
      })
      .filter((item): item is FinancialGoal => item !== null)
  } catch {
    return []
  }
}

function readStoredMonthlyPlans() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(monthlyPlansStorageKey)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((item) => {
        const id = String(item.id ?? '').trim()
        const name = String(item.name ?? '').trim()
        const monthKey = String(item.monthKey ?? '').slice(0, 7)
        const plannedAmount = Number(item.plannedAmount ?? 0)
        const categoryKey = String(item.categoryKey ?? 'all_expenses')

        if (!id || !name || !monthKey || plannedAmount <= 0) {
          return null
        }

        return {
          id,
          name,
          monthKey,
          plannedAmount,
          categoryKey,
          createdAt: String(item.createdAt ?? new Date().toISOString()),
        } satisfies MonthlyPlan
      })
      .filter((item): item is MonthlyPlan => item !== null)
  } catch {
    return []
  }
}

function readStoredRecurringTransactions() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(recurringTransactionsStorageKey)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((item) => {
        const id = String(item.id ?? '').trim()
        const name = String(item.name ?? '').trim()
        const type =
          item.type === 'receita' || item.type === 'despesa'
            ? item.type
            : undefined
        const categoryKey = String(item.categoryKey ?? '').trim()
        const amount = Number(item.amount ?? 0)
        const frequency =
          item.frequency === 'semanal' ||
          item.frequency === 'quinzenal' ||
          item.frequency === 'mensal' ||
          item.frequency === 'anual'
            ? item.frequency
            : 'mensal'
        const nextDueDate = String(item.nextDueDate ?? '').slice(0, 10)
        const isActive = item.isActive !== false
        const paymentMethod = parsePaymentMethod(item.paymentMethod)
        const cardProvider = parseCardProvider(item.cardProvider)
        const normalizedCardProvider =
          paymentMethod === 'cartao' ? cardProvider : null

        if (!id || !name || !type || !categoryKey || !nextDueDate || amount <= 0) {
          return null
        }

        return {
          id,
          name,
          type,
          categoryKey,
          amount,
          frequency,
          nextDueDate,
          isActive,
          paymentMethod,
          cardProvider: normalizedCardProvider,
          description: String(item.description ?? ''),
          createdAt: String(item.createdAt ?? new Date().toISOString()),
        } satisfies RecurringTransaction
      })
      .filter((item): item is RecurringTransaction => item !== null)
  } catch {
    return []
  }
}

function readStoredInvestmentPositions() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(investmentPositionsStorageKey)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((item) => {
        const id = String(item.id ?? '').trim()
        const name = String(item.name ?? '').trim()
        const type = String(item.type ?? '') as InvestmentType
        const investedAmount = Number(item.investedAmount ?? 0)
        const currentValue = Number(item.currentValue ?? 0)
        const startDate = String(item.startDate ?? '').slice(0, 10)
        const isActive = item.isActive !== false

        if (
          !id ||
          !name ||
          !investmentTypeOptions.some((option) => option.value === type) ||
          investedAmount <= 0 ||
          currentValue < 0 ||
          !startDate
        ) {
          return null
        }

        return {
          id,
          name,
          type,
          investedAmount,
          currentValue,
          startDate,
          notes: String(item.notes ?? ''),
          isActive,
          createdAt: String(item.createdAt ?? new Date().toISOString()),
        } satisfies InvestmentPosition
      })
      .filter((item): item is InvestmentPosition => item !== null)
  } catch {
    return []
  }
}

function getInitialThemeMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  const stored = window.localStorage.getItem(themeStorageKey)
  if (stored === 'dark' || stored === 'light') {
    return stored
  }

  return 'dark'
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-700">
        Carregando...
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function HomePage() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(display-mode: standalone)').matches,
  )

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    const onAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener(
      'beforeinstallprompt',
      onBeforeInstallPrompt as EventListener,
    )
    window.addEventListener('appinstalled', onAppInstalled)

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        onBeforeInstallPrompt as EventListener,
      )
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!installPrompt) {
      return
    }

    await installPrompt.prompt()
    const choice = await installPrompt.userChoice

    if (choice.outcome === 'accepted') {
      setIsInstalled(true)
    }

    setInstallPrompt(null)
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-cover bg-center px-4 py-8 md:px-6"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(5, 10, 20, 0.78), rgba(5, 10, 20, 0.9)), url(${authBackground})`,
      }}
    >
      <section className="mx-auto mt-6 w-full max-w-md sm:max-w-xl md:max-w-2xl">
        <Card className="relative overflow-hidden border-white/15 bg-transparent shadow-[var(--m3-elevation-2)]">
          <div className="absolute inset-0">
            <img
              src={cardBackground}
              alt="Fundo financeiro"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/80" />
          </div>

          <div className="relative min-h-[430px] p-8 text-[var(--m3-on-primary)] md:min-h-[460px] md:p-10">
            <header className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white">
                  Poupe Bem
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">
                  Gestao Financeira Inteligente
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85 md:text-base">
                  Organize receitas, despesas e metas em um unico lugar, com
                  acesso rapido ao seu painel financeiro.
                </p>
              </div>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </header>

            <Show when="signed-out">
              <div className="flex w-full flex-col items-center gap-3 md:flex-row md:justify-center">
                <SignInButton
                  mode="redirect"
                  forceRedirectUrl="/dashboard/resumo"
                  fallbackRedirectUrl="/dashboard/resumo"
                >
                  <Button className="w-full max-w-sm bg-[var(--m3-primary)] text-[var(--m3-on-primary)] md:w-[260px] md:max-w-none">
                    Entrar
                  </Button>
                </SignInButton>
                <SignUpButton
                  mode="redirect"
                  forceRedirectUrl="/dashboard/resumo"
                  fallbackRedirectUrl="/dashboard/resumo"
                >
                  <Button
                    variant="tonal"
                    className="w-full max-w-sm bg-white/15 text-white backdrop-blur hover:bg-white/25 md:w-[260px] md:max-w-none"
                  >
                    Criar conta
                  </Button>
                </SignUpButton>
              </div>

              <div className="mt-3 flex w-full justify-center">
                <Button
                  variant="outline"
                  onClick={handleInstallClick}
                  disabled={!installPrompt || isInstalled}
                  className="w-full max-w-sm border-white/35 text-white hover:bg-white/15 md:w-[536px] md:max-w-none"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isInstalled ? 'App instalado' : 'Instalar app'}
                </Button>
              </div>
            </Show>

            <Show when="signed-in">
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button asChild className="w-full sm:w-auto">
                  <Link to="/dashboard/resumo">Abrir dashboard</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-white/35 text-white sm:w-auto"
                >
                  <Link to="/">Atualizar pagina</Link>
                </Button>
              </div>
            </Show>
          </div>
        </Card>
      </section>
    </main>
  )
}

function DashboardPage({
  transactions,
  categories,
  goals,
  onOpenAdd,
  onEditTransaction,
  onDeleteTransaction,
  onCreateCategory,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal,
  onAddGoalAmount,
  themeMode,
  onToggleThemeMode,
  themePresets,
  activeThemeId,
  onCreateTheme,
  onApplyTheme,
  onDeleteTheme,
  getDbContext,
}: DashboardPageProps) {
  const { user } = useUser()
  const { section } = useParams<{ section?: string }>()
  const activeSection: DashboardSectionKey = dashboardSections.some(
    (item) => item.key === section,
  )
    ? (section as DashboardSectionKey)
    : 'resumo'
  const [summarySearch, setSummarySearch] = useState('')
  const [summaryCategoryFilter, setSummaryCategoryFilter] = useState<string>('all')
  const [summaryMonthFilter, setSummaryMonthFilter] = useState<string>(
    getTodayDate().slice(5, 7),
  )
  const [summaryYearFilter, setSummaryYearFilter] = useState<string>(
    getTodayDate().slice(0, 4),
  )
  const [summaryTypeFilter, setSummaryTypeFilter] = useState<SummaryTypeFilter>('todos')
  const [newCategoryType, setNewCategoryType] = useState<TransactionType>('despesa')
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newThemeName, setNewThemeName] = useState('')
  const [newThemePrimaryColor, setNewThemePrimaryColor] = useState('#89a6ff')
  const [newThemeAccentColor, setNewThemeAccentColor] = useState('#10b981')
  const [newThemeNavFrom, setNewThemeNavFrom] = useState('#1a2f66')
  const [newThemeNavVia, setNewThemeNavVia] = useState('#132852')
  const [newThemeNavTo, setNewThemeNavTo] = useState('#0f1f43')
  const [newGoalName, setNewGoalName] = useState('')
  const [newGoalValue, setNewGoalValue] = useState('')
  const [newGoalDate, setNewGoalDate] = useState(getTodayDate())
  const [goalContribution, setGoalContribution] = useState<Record<string, string>>({})
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [editingGoalName, setEditingGoalName] = useState('')
  const [editingGoalValue, setEditingGoalValue] = useState('')
  const [editingGoalDate, setEditingGoalDate] = useState('')
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false)
  const [monthlyPlans, setMonthlyPlans] = useState<MonthlyPlan[]>(() =>
    readStoredMonthlyPlans(),
  )
  const [planningMonthKey, setPlanningMonthKey] = useState(getTodayDate().slice(0, 7))
  const [isPlanFormOpen, setIsPlanFormOpen] = useState(false)
  const [newPlanName, setNewPlanName] = useState('')
  const [newPlanAmount, setNewPlanAmount] = useState('')
  const [newPlanCategoryKey, setNewPlanCategoryKey] = useState('all_expenses')
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [editingPlanName, setEditingPlanName] = useState('')
  const [editingPlanAmount, setEditingPlanAmount] = useState('')
  const [editingPlanCategoryKey, setEditingPlanCategoryKey] = useState('all_expenses')
  const [recurringTransactions, setRecurringTransactions] = useState<
    RecurringTransaction[]
  >(() => readStoredRecurringTransactions())
  const [isRecurringFormOpen, setIsRecurringFormOpen] = useState(false)
  const [recurringFormName, setRecurringFormName] = useState('')
  const [recurringFormType, setRecurringFormType] = useState<TransactionType>('despesa')
  const [recurringFormAmount, setRecurringFormAmount] = useState('')
  const [recurringFormCategoryKey, setRecurringFormCategoryKey] = useState('')
  const [recurringFormFrequency, setRecurringFormFrequency] =
    useState<RecurringFrequency>('mensal')
  const [recurringFormNextDate, setRecurringFormNextDate] = useState(getTodayDate())
  const [recurringFormPaymentMethod, setRecurringFormPaymentMethod] = useState<
    '' | PaymentMethod
  >('')
  const [recurringFormCardProvider, setRecurringFormCardProvider] = useState<
    '' | CardProvider
  >('')
  const [recurringFormDescription, setRecurringFormDescription] = useState('')
  const [editingRecurringId, setEditingRecurringId] = useState<string | null>(null)
  const [investmentPositions, setInvestmentPositions] = useState<InvestmentPosition[]>(
    () => readStoredInvestmentPositions(),
  )
  const [isInvestmentFormOpen, setIsInvestmentFormOpen] = useState(false)
  const [investmentFormName, setInvestmentFormName] = useState('')
  const [investmentFormType, setInvestmentFormType] = useState<InvestmentType>('acoes')
  const [investmentFormInvested, setInvestmentFormInvested] = useState('')
  const [investmentFormCurrent, setInvestmentFormCurrent] = useState('')
  const [investmentFormStartDate, setInvestmentFormStartDate] = useState(getTodayDate())
  const [investmentFormNotes, setInvestmentFormNotes] = useState('')
  const [editingInvestmentId, setEditingInvestmentId] = useState<string | null>(null)
  const [reportMonth, setReportMonth] = useState(getTodayDate().slice(5, 7))
  const [reportYear, setReportYear] = useState(getTodayDate().slice(0, 4))
  const [recurringReportMode, setRecurringReportMode] = useState<'mensal' | 'anual'>(
    'mensal',
  )
  const [annualReportYear, setAnnualReportYear] = useState(getTodayDate().slice(0, 4))
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<null | 'monthly' | 'annual'>(
    null,
  )
  const monthlyReportRef = useRef<HTMLDivElement | null>(null)
  const annualReportRef = useRef<HTMLDivElement | null>(null)

  const currentMonthKey = getTodayDate().slice(0, 7)
  const [chartMonthCursor, setChartMonthCursor] = useState(currentMonthKey)

  const dataRangeStartMonthKey = useMemo(() => {
    const monthKeys = [
      currentMonthKey,
      ...transactions.map((item) => item.date.slice(0, 7)),
      ...recurringTransactions
        .filter((item) => item.isActive)
        .map((item) => item.nextDueDate.slice(0, 7)),
    ]
    return [...monthKeys].sort((a, b) => a.localeCompare(b))[0] ?? currentMonthKey
  }, [transactions, recurringTransactions, currentMonthKey])

  const dataRangeEndMonthKey = useMemo(() => {
    const monthKeys = [
      addMonthsToMonthKey(currentMonthKey, 60),
      ...transactions.map((item) => item.date.slice(0, 7)),
    ]
    return [...monthKeys].sort((a, b) => b.localeCompare(a))[0] ?? currentMonthKey
  }, [transactions, currentMonthKey])

  const projectedRecurringEntries = useMemo(
    () =>
      projectRecurringEntries(
        recurringTransactions,
        categories,
        dataRangeStartMonthKey,
        dataRangeEndMonthKey,
      ),
    [recurringTransactions, categories, dataRangeStartMonthKey, dataRangeEndMonthKey],
  )

  const dashboardEntries = useMemo<DashboardEntry[]>(
    () => [
      ...transactions.map((item) => ({
        id: item.id,
        source: 'transacao' as const,
        sourceId: item.id,
        type: item.type,
        date: item.date,
        value: item.value,
        categoryKey: item.categoryKey,
        categoryLabel: item.categoryLabel,
        description: item.description,
        installmentNumber: item.installmentNumber,
        installmentCount: item.installmentCount,
        paymentMethod: item.paymentMethod,
        cardProvider: item.cardProvider,
      })),
      ...projectedRecurringEntries,
    ],
    [transactions, projectedRecurringEntries],
  )

  const chartData = useMemo(() => buildChartData(dashboardEntries), [dashboardEntries])
  const chartMonthKeys = useMemo(
    () => chartData.map((item) => item.monthKey),
    [chartData],
  )
  const safeChartIndex = Math.max(
    0,
    chartMonthKeys.indexOf(chartMonthCursor),
  )
  const chartWindowData = chartData.slice(Math.max(0, safeChartIndex - 5), safeChartIndex + 1)
  const chartCursorLabel = formatMonthTitle(
    chartMonthKeys[safeChartIndex] ?? currentMonthKey,
  )
  const selectedMonthKey = chartMonthKeys[safeChartIndex] ?? currentMonthKey

  useEffect(() => {
    if (chartMonthKeys.length === 0) {
      return
    }
    if (!chartMonthKeys.includes(chartMonthCursor)) {
      setChartMonthCursor(chartMonthKeys[chartMonthKeys.length - 1])
    }
  }, [chartMonthKeys, chartMonthCursor])

  useEffect(() => {
    setSummaryMonthFilter(selectedMonthKey.slice(5, 7))
    setSummaryYearFilter(selectedMonthKey.slice(0, 4))
  }, [selectedMonthKey])

  useEffect(() => {
    window.localStorage.setItem(monthlyPlansStorageKey, JSON.stringify(monthlyPlans))
  }, [monthlyPlans])

  useEffect(() => {
    window.localStorage.setItem(
      recurringTransactionsStorageKey,
      JSON.stringify(recurringTransactions),
    )
  }, [recurringTransactions])

  useEffect(() => {
    window.localStorage.setItem(
      investmentPositionsStorageKey,
      JSON.stringify(investmentPositions),
    )
  }, [investmentPositions])

  useEffect(() => {
    let isCancelled = false

    const syncDashboardModulesFromDb = async () => {
      const context = await getDbContext()
      if (!context || isCancelled) {
        return
      }

      const [{ data: recurringRows, error: recurringError }, { data: investmentRows, error: investmentError }] =
        await Promise.all([
          context.db
            .from('recurring_transactions')
            .select('*')
            .order('created_at', { ascending: false }),
          context.db
            .from('investment_positions')
            .select('*')
            .order('created_at', { ascending: false }),
        ])

      if (!recurringError && recurringRows && !isCancelled) {
        setRecurringTransactions(
          (recurringRows as DbRecurringRow[]).map(mapDbRecurringRow),
        )
      }

      if (!investmentError && investmentRows && !isCancelled) {
        setInvestmentPositions(
          (investmentRows as DbInvestmentRow[]).map(mapDbInvestmentRow),
        )
      }
    }

    void syncDashboardModulesFromDb()

    return () => {
      isCancelled = true
    }
  }, [getDbContext])

  const monthIncome = useMemo(
    () =>
      dashboardEntries
        .filter(
          (item) =>
            item.type === 'receita' && item.date.slice(0, 7) === selectedMonthKey,
        )
        .reduce((acc, item) => acc + item.value, 0),
    [dashboardEntries, selectedMonthKey],
  )

  const monthExpense = useMemo(
    () =>
      dashboardEntries
        .filter(
          (item) =>
            item.type === 'despesa' && item.date.slice(0, 7) === selectedMonthKey,
        )
        .reduce((acc, item) => acc + item.value, 0),
    [dashboardEntries, selectedMonthKey],
  )

  const monthTransactionCount = useMemo(
    () =>
      dashboardEntries.filter((item) => item.date.slice(0, 7) === selectedMonthKey)
        .length,
    [dashboardEntries, selectedMonthKey],
  )

  const balance = monthIncome - monthExpense

  const cards = [
    {
      title: 'Saldo total',
      value: formatCurrency(balance),
      icon: CircleDollarSign,
      detail: `${monthTransactionCount} lancamentos em ${formatMonthLabel(selectedMonthKey)}`,
      tone: balance >= 0 ? 'positive' : 'negative',
    },
    {
      title: 'Receitas do mes',
      value: formatCurrency(monthIncome),
      icon: TrendingUp,
      detail: formatMonthLabel(selectedMonthKey),
      tone: 'positive',
    },
    {
      title: 'Despesas do mes',
      value: formatCurrency(monthExpense),
      icon: TrendingDown,
      detail: formatMonthLabel(selectedMonthKey),
      tone: 'negative',
    },
  ] as const

  const summaryCategoryOptions = useMemo(
    () =>
      Array.from(
        new Map(categories.map((category) => [category.key, category])).values(),
      ).sort((a, b) => a.label.localeCompare(b.label)),
    [categories],
  )

  const summaryYearOptions = useMemo(
    () =>
      Array.from(new Set(dashboardEntries.map((item) => item.date.slice(0, 4)))).sort(
        (a, b) => b.localeCompare(a),
      ),
    [dashboardEntries],
  )

  const summaryItems = useMemo(() => {
    const normalizedSearch = summarySearch.trim().toLowerCase()
    const filtered = dashboardEntries.filter((item) => {
      const monthMatch =
        summaryMonthFilter === 'all' || item.date.slice(5, 7) === summaryMonthFilter
      const yearMatch =
        summaryYearFilter === 'all' || item.date.slice(0, 4) === summaryYearFilter
      const typeMatch =
        summaryTypeFilter === 'todos'
          ? true
          : summaryTypeFilter === 'recorrentes'
            ? item.source === 'recorrente'
            : item.type === summaryTypeFilter
      const categoryMatch =
        summaryCategoryFilter === 'all' || item.categoryKey === summaryCategoryFilter
      const searchMatch =
        normalizedSearch.length === 0 ||
        `${item.categoryLabel} ${item.description} ${item.value} ${item.date} ${item.source} ${getPaymentMethodLabel(item.paymentMethod, item.cardProvider)}`
          .toLowerCase()
          .includes(normalizedSearch)
      return monthMatch && yearMatch && typeMatch && categoryMatch && searchMatch
    })

    filtered.sort((a, b) => {
      const first = new Date(`${a.date}T12:00:00`).getTime()
      const second = new Date(`${b.date}T12:00:00`).getTime()
      return second - first
    })

    return filtered
  }, [
    dashboardEntries,
    summarySearch,
    summaryCategoryFilter,
    summaryMonthFilter,
    summaryYearFilter,
    summaryTypeFilter,
  ])

  const sortedInvestmentPositions = useMemo(
    () =>
      [...investmentPositions].sort((a, b) => {
        const first = new Date(`${a.startDate}T12:00:00`).getTime()
        const second = new Date(`${b.startDate}T12:00:00`).getTime()
        return second - first
      }),
    [investmentPositions],
  )

  const investmentTotals = useMemo(() => {
    const active = investmentPositions.filter((item) => item.isActive)
    const totalInvested = active.reduce((acc, item) => acc + item.investedAmount, 0)
    const totalCurrent = active.reduce((acc, item) => acc + item.currentValue, 0)
    const returnValue = totalCurrent - totalInvested
    const returnPercent = totalInvested > 0 ? (returnValue / totalInvested) * 100 : 0
    return { totalInvested, totalCurrent, returnValue, returnPercent }
  }, [investmentPositions])

  const investmentByType = useMemo(() => {
    const totals = new Map<InvestmentType, number>()
    investmentPositions
      .filter((item) => item.isActive)
      .forEach((item) => {
        const current = totals.get(item.type) ?? 0
        totals.set(item.type, current + item.currentValue)
      })

    return Array.from(totals.entries())
      .map(([type, amount]) => ({ type, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [investmentPositions])

  const topInvestment = useMemo(() => {
    const active = investmentPositions.filter((item) => item.isActive)
    if (active.length === 0) {
      return null
    }

    return [...active].sort((a, b) => {
      const aReturn = a.currentValue - a.investedAmount
      const bReturn = b.currentValue - b.investedAmount
      return bReturn - aReturn
    })[0]
  }, [investmentPositions])

  const reportYearOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...transactions.map((item) => item.date.slice(0, 4)),
          ...recurringTransactions.map((item) => item.nextDueDate.slice(0, 4)),
          ...investmentPositions.map((item) => item.startDate.slice(0, 4)),
          getTodayDate().slice(0, 4),
        ]),
      ).sort((a, b) => b.localeCompare(a)),
    [transactions, recurringTransactions, investmentPositions],
  )

  useEffect(() => {
    if (!reportYearOptions.includes(reportYear)) {
      setReportYear(reportYearOptions[0] ?? getTodayDate().slice(0, 4))
    }
    if (!reportYearOptions.includes(annualReportYear)) {
      setAnnualReportYear(reportYearOptions[0] ?? getTodayDate().slice(0, 4))
    }
  }, [reportYearOptions, reportYear, annualReportYear])

  const reportMonthKey = `${reportYear}-${reportMonth}`
  const expenseTransactionsForReport = useMemo(
    () =>
      transactions.filter(
        (item) =>
          String(item.type).toLowerCase() !== 'receita' &&
          item.date.slice(0, 7) === reportMonthKey,
      ),
    [transactions, reportMonthKey],
  )

  const expenseCategoryData = useMemo(() => {
    const map = new Map<string, number>()
    expenseTransactionsForReport.forEach((item) => {
      const categoryLabel =
        getCategoryByKey(item.categoryKey, categories)?.label ??
        item.categoryLabel ??
        'Sem categoria'
      const current = map.get(categoryLabel) ?? 0
      map.set(categoryLabel, current + item.value)
    })
    const total = Array.from(map.values()).reduce((acc, value) => acc + value, 0)
    return Array.from(map.entries())
      .map(([label, value], index) => ({
        label,
        value,
        percent: total > 0 ? (value / total) * 100 : 0,
        color: reportPalette[index % reportPalette.length],
      }))
      .sort((a, b) => b.value - a.value)
  }, [expenseTransactionsForReport, categories])

  const recurringCategoryData = useMemo(() => {
    const map = new Map<string, number>()
    recurringTransactions
      .filter((item) => item.isActive && item.type === 'despesa')
      .forEach((item) => {
        const categoryLabel = getCategoryByKey(item.categoryKey, categories)?.label ?? 'Outros'
        const baseAmount = getRecurringMonthlyAmount(item)
        const value = recurringReportMode === 'mensal' ? baseAmount : baseAmount * 12
        const current = map.get(categoryLabel) ?? 0
        map.set(categoryLabel, current + value)
      })

    return Array.from(map.entries())
      .map(([label, value], index) => ({
        label,
        value,
        color: reportPalette[index % reportPalette.length],
      }))
      .sort((a, b) => b.value - a.value)
  }, [recurringTransactions, categories, recurringReportMode])

  const recurringTotalValue = recurringCategoryData.reduce(
    (acc, item) => acc + item.value,
    0,
  )

  const annualTransactions = useMemo(
    () => transactions.filter((item) => item.date.slice(0, 4) === annualReportYear),
    [transactions, annualReportYear],
  )

  const annualIncomeTotal = annualTransactions
    .filter((item) => item.type === 'receita')
    .reduce((acc, item) => acc + item.value, 0)
  const annualExpenseTotal = annualTransactions
    .filter((item) => item.type === 'despesa')
    .reduce((acc, item) => acc + item.value, 0)
  const annualBalanceTotal = annualIncomeTotal - annualExpenseTotal
  const annualAverageBalance = annualBalanceTotal / 12
  const annualOverviewData = [
    { label: 'Entradas', value: annualIncomeTotal, color: annualPalette[0] },
    { label: 'Saídas', value: annualExpenseTotal, color: annualPalette[1] },
    { label: 'Saldo Final', value: Math.max(annualBalanceTotal, 0), color: annualPalette[2] },
  ]

  const investmentPortfolioData = useMemo(
    () => {
      const map = new Map<InvestmentType, number>()
      investmentPositions
        .filter((item) => item.isActive)
        .forEach((item) => {
          const current = map.get(item.type) ?? 0
          map.set(item.type, current + item.currentValue)
        })

      return Array.from(map.entries())
        .map(([type, value], index) => ({
          type,
          label: getInvestmentTypeLabel(type),
          value,
          color: reportPalette[index % reportPalette.length],
        }))
        .sort((a, b) => b.value - a.value)
    },
    [investmentPositions],
  )

  const activeInvestmentsCount = investmentPositions.filter((item) => item.isActive).length

  const expenseCategoriesView = useMemo(
    () => getCategoriesByType('despesa', categories),
    [categories],
  )

  const recurringCategoryOptions = useMemo(
    () => getCategoriesByType(recurringFormType, categories),
    [recurringFormType, categories],
  )

  useEffect(() => {
    if (recurringCategoryOptions.length === 0) {
      setRecurringFormCategoryKey('')
      return
    }

    const hasSelected = recurringCategoryOptions.some(
      (category) => category.key === recurringFormCategoryKey,
    )
    if (!hasSelected) {
      setRecurringFormCategoryKey(recurringCategoryOptions[0]?.key ?? '')
    }
  }, [recurringCategoryOptions, recurringFormCategoryKey])

  const planningMonthOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...transactions.map((item) => item.date.slice(0, 7)),
          ...monthlyPlans.map((item) => item.monthKey),
          selectedMonthKey,
        ]),
      ).sort((a, b) => b.localeCompare(a)),
    [transactions, monthlyPlans, selectedMonthKey],
  )

  useEffect(() => {
    if (!planningMonthOptions.includes(planningMonthKey)) {
      setPlanningMonthKey(planningMonthOptions[0] ?? getTodayDate().slice(0, 7))
    }
  }, [planningMonthOptions, planningMonthKey])

  const planningExpenseTransactions = useMemo(
    () =>
      transactions.filter(
        (item) =>
          item.type === 'despesa' && item.date.slice(0, 7) === planningMonthKey,
      ),
    [transactions, planningMonthKey],
  )

  const plansForMonth = useMemo(
    () =>
      monthlyPlans
        .filter((item) => item.monthKey === planningMonthKey)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [monthlyPlans, planningMonthKey],
  )

  const planningTotalSpent = useMemo(
    () => planningExpenseTransactions.reduce((acc, item) => acc + item.value, 0),
    [planningExpenseTransactions],
  )

  const planningTotalPlanned = useMemo(
    () => plansForMonth.reduce((acc, item) => acc + item.plannedAmount, 0),
    [plansForMonth],
  )

  const planningTotalBalance = planningTotalPlanned - planningTotalSpent
  const planningProgressPercent =
    planningTotalPlanned > 0
      ? Math.min((planningTotalSpent / planningTotalPlanned) * 100, 100)
      : 0

  const recurringIncome = useMemo(
    () =>
      recurringTransactions
        .filter((item) => item.isActive && item.type === 'receita')
        .reduce((acc, item) => acc + getRecurringMonthlyAmount(item), 0),
    [recurringTransactions],
  )

  const recurringExpense = useMemo(
    () =>
      recurringTransactions
        .filter((item) => item.isActive && item.type === 'despesa')
        .reduce((acc, item) => acc + getRecurringMonthlyAmount(item), 0),
    [recurringTransactions],
  )

  const recurringBalance = recurringIncome - recurringExpense

  const sortedRecurringTransactions = useMemo(
    () =>
      [...recurringTransactions].sort((a, b) => {
        const first = new Date(`${a.nextDueDate}T12:00:00`).getTime()
        const second = new Date(`${b.nextDueDate}T12:00:00`).getTime()
        return first - second
      }),
    [recurringTransactions],
  )

  const handleCreateCategorySubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const label = newCategoryName.trim()
    const emoji = newCategoryEmoji.trim()

    if (!label || !emoji) {
      return
    }

    onCreateCategory({
      type: newCategoryType,
      emoji,
      label,
    })

    setNewCategoryName('')
    setNewCategoryEmoji('')
  }

  const handleCreateThemeSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const name = newThemeName.trim()
    if (
      !name ||
      !isHexColor(newThemePrimaryColor) ||
      !isHexColor(newThemeAccentColor) ||
      !isHexColor(newThemeNavFrom) ||
      !isHexColor(newThemeNavVia) ||
      !isHexColor(newThemeNavTo)
    ) {
      return
    }

    onCreateTheme({
      name,
      primaryColor: newThemePrimaryColor,
      accentColor: newThemeAccentColor,
      navFrom: newThemeNavFrom,
      navVia: newThemeNavVia,
      navTo: newThemeNavTo,
    })

    setNewThemeName('')
  }

  const handleCreateGoalSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = newGoalName.trim()
    const targetAmount = Number(newGoalValue.replace(',', '.'))

    if (!name || !Number.isFinite(targetAmount) || targetAmount <= 0 || !newGoalDate) {
      return
    }

    onCreateGoal({
      name,
      targetAmount,
      targetDate: newGoalDate,
    })

    setNewGoalName('')
    setNewGoalValue('')
    setNewGoalDate(getTodayDate())
    setIsGoalFormOpen(false)
  }

  const startEditingGoal = (goal: FinancialGoal) => {
    setEditingGoalId(goal.id)
    setEditingGoalName(goal.name)
    setEditingGoalValue(String(goal.targetAmount))
    setEditingGoalDate(goal.targetDate)
  }

  const handleCreatePlanSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const name = newPlanName.trim()
    const plannedAmount = Number(newPlanAmount.replace(',', '.'))
    if (!name || !Number.isFinite(plannedAmount) || plannedAmount <= 0) {
      return
    }

    setMonthlyPlans((previous) => [
      {
        id: generateId(),
        name,
        monthKey: planningMonthKey,
        plannedAmount,
        categoryKey: newPlanCategoryKey,
        createdAt: new Date().toISOString(),
      },
      ...previous,
    ])

    setNewPlanName('')
    setNewPlanAmount('')
    setNewPlanCategoryKey('all_expenses')
    setIsPlanFormOpen(false)
  }

  const startEditingPlan = (plan: MonthlyPlan) => {
    setEditingPlanId(plan.id)
    setEditingPlanName(plan.name)
    setEditingPlanAmount(String(plan.plannedAmount))
    setEditingPlanCategoryKey(plan.categoryKey)
  }

  const handleSavePlanEdit = (plan: MonthlyPlan) => {
    const name = editingPlanName.trim()
    const plannedAmount = Number(editingPlanAmount.replace(',', '.'))
    if (!name || !Number.isFinite(plannedAmount) || plannedAmount <= 0) {
      return
    }

    setMonthlyPlans((previous) =>
      previous.map((item) =>
        item.id === plan.id
          ? {
              ...item,
              name,
              plannedAmount,
              categoryKey: editingPlanCategoryKey,
            }
          : item,
      ),
    )
    setEditingPlanId(null)
  }

  const getPlanSpent = (plan: MonthlyPlan) => {
    if (plan.categoryKey === 'all_expenses') {
      return planningTotalSpent
    }

    return planningExpenseTransactions
      .filter((item) => item.categoryKey === plan.categoryKey)
      .reduce((acc, item) => acc + item.value, 0)
  }

  const resetRecurringForm = () => {
    setRecurringFormName('')
    setRecurringFormType('despesa')
    setRecurringFormAmount('')
    setRecurringFormCategoryKey(getCategoriesByType('despesa', categories)[0]?.key ?? '')
    setRecurringFormFrequency('mensal')
    setRecurringFormNextDate(getTodayDate())
    setRecurringFormPaymentMethod('')
    setRecurringFormCardProvider('')
    setRecurringFormDescription('')
    setEditingRecurringId(null)
  }

  const handleCreateOrUpdateRecurring = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const name = recurringFormName.trim()
    const amount = Number(recurringFormAmount.replace(',', '.'))
    if (
      !name ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !recurringFormCategoryKey ||
      !recurringFormNextDate
    ) {
      return
    }

    const paymentMethod = parsePaymentMethod(recurringFormPaymentMethod)
    const cardProvider =
      paymentMethod === 'cartao' ? parseCardProvider(recurringFormCardProvider) : null

    if (paymentMethod === 'cartao' && !cardProvider) {
      return
    }

    const context = await getDbContext()
    if (context) {
      if (editingRecurringId) {
        const { error } = await context.db
          .from('recurring_transactions')
          .update({
            name,
            type: recurringFormType,
            amount,
            category_key: recurringFormCategoryKey,
            frequency: recurringFormFrequency,
            next_due_date: recurringFormNextDate,
            payment_method: paymentMethod,
            card_provider: cardProvider,
            description: recurringFormDescription.trim() || null,
          })
          .eq('id', editingRecurringId)

        if (!error) {
          const { data: recurringRows, error: fetchError } = await context.db
            .from('recurring_transactions')
            .select('*')
            .order('created_at', { ascending: false })
          if (!fetchError && recurringRows) {
            setRecurringTransactions(
              (recurringRows as DbRecurringRow[]).map(mapDbRecurringRow),
            )
            setIsRecurringFormOpen(false)
            resetRecurringForm()
            return
          }
        } else {
          console.error('Falha ao atualizar recorrente no Supabase:', error)
        }
      } else {
        const { error } = await context.db.from('recurring_transactions').insert({
          user_id: context.appUserId,
          name,
          type: recurringFormType,
          amount,
          category_key: recurringFormCategoryKey,
          frequency: recurringFormFrequency,
          next_due_date: recurringFormNextDate,
          payment_method: paymentMethod,
          card_provider: cardProvider,
          is_active: true,
          description: recurringFormDescription.trim() || null,
        })

        if (!error) {
          const { data: recurringRows, error: fetchError } = await context.db
            .from('recurring_transactions')
            .select('*')
            .order('created_at', { ascending: false })
          if (!fetchError && recurringRows) {
            setRecurringTransactions(
              (recurringRows as DbRecurringRow[]).map(mapDbRecurringRow),
            )
            setIsRecurringFormOpen(false)
            resetRecurringForm()
            return
          }
        } else {
          console.error('Falha ao criar recorrente no Supabase:', error)
        }
      }
    }

    if (editingRecurringId) {
      setRecurringTransactions((previous) =>
        previous.map((item) =>
          item.id === editingRecurringId
            ? {
                ...item,
                name,
                type: recurringFormType,
                amount,
                categoryKey: recurringFormCategoryKey,
                frequency: recurringFormFrequency,
                nextDueDate: recurringFormNextDate,
                paymentMethod,
                cardProvider,
                description: recurringFormDescription.trim(),
              }
            : item,
        ),
      )
    } else {
      setRecurringTransactions((previous) => [
        {
          id: generateId(),
          name,
          type: recurringFormType,
          amount,
          categoryKey: recurringFormCategoryKey,
          frequency: recurringFormFrequency,
          nextDueDate: recurringFormNextDate,
          isActive: true,
          paymentMethod,
          cardProvider,
          description: recurringFormDescription.trim(),
          createdAt: new Date().toISOString(),
        },
        ...previous,
      ])
    }

    setIsRecurringFormOpen(false)
    resetRecurringForm()
  }

  const startEditingRecurring = (item: RecurringTransaction) => {
    setEditingRecurringId(item.id)
    setRecurringFormName(item.name)
    setRecurringFormType(item.type)
    setRecurringFormAmount(String(item.amount))
    setRecurringFormCategoryKey(item.categoryKey)
    setRecurringFormFrequency(item.frequency)
    setRecurringFormNextDate(item.nextDueDate)
    setRecurringFormPaymentMethod(item.paymentMethod ?? '')
    setRecurringFormCardProvider(item.cardProvider ?? '')
    setRecurringFormDescription(item.description)
    setIsRecurringFormOpen(true)
  }

  const resetInvestmentForm = () => {
    setInvestmentFormName('')
    setInvestmentFormType('acoes')
    setInvestmentFormInvested('')
    setInvestmentFormCurrent('')
    setInvestmentFormStartDate(getTodayDate())
    setInvestmentFormNotes('')
    setEditingInvestmentId(null)
  }

  const handleCreateOrUpdateInvestment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const name = investmentFormName.trim()
    const investedAmount = Number(investmentFormInvested.replace(',', '.'))
    const currentValue = Number(investmentFormCurrent.replace(',', '.'))
    if (
      !name ||
      !Number.isFinite(investedAmount) ||
      !Number.isFinite(currentValue) ||
      investedAmount <= 0 ||
      currentValue < 0 ||
      !investmentFormStartDate
    ) {
      return
    }

    const context = await getDbContext()
    if (context) {
      if (editingInvestmentId) {
        const { error } = await context.db
          .from('investment_positions')
          .update({
            name,
            type: investmentFormType,
            invested_amount: investedAmount,
            current_value: currentValue,
            start_date: investmentFormStartDate,
            notes: investmentFormNotes.trim() || null,
          })
          .eq('id', editingInvestmentId)

        if (!error) {
          const { data: investmentRows, error: fetchError } = await context.db
            .from('investment_positions')
            .select('*')
            .order('created_at', { ascending: false })
          if (!fetchError && investmentRows) {
            setInvestmentPositions(
              (investmentRows as DbInvestmentRow[]).map(mapDbInvestmentRow),
            )
            setIsInvestmentFormOpen(false)
            resetInvestmentForm()
            return
          }
        } else {
          console.error('Falha ao atualizar investimento no Supabase:', error)
        }
      } else {
        const { error } = await context.db.from('investment_positions').insert({
          user_id: context.appUserId,
          name,
          type: investmentFormType,
          invested_amount: investedAmount,
          current_value: currentValue,
          start_date: investmentFormStartDate,
          notes: investmentFormNotes.trim() || null,
          is_active: true,
        })

        if (!error) {
          const { data: investmentRows, error: fetchError } = await context.db
            .from('investment_positions')
            .select('*')
            .order('created_at', { ascending: false })
          if (!fetchError && investmentRows) {
            setInvestmentPositions(
              (investmentRows as DbInvestmentRow[]).map(mapDbInvestmentRow),
            )
            setIsInvestmentFormOpen(false)
            resetInvestmentForm()
            return
          }
        } else {
          console.error('Falha ao criar investimento no Supabase:', error)
        }
      }
    }

    if (editingInvestmentId) {
      setInvestmentPositions((previous) =>
        previous.map((item) =>
          item.id === editingInvestmentId
            ? {
                ...item,
                name,
                type: investmentFormType,
                investedAmount,
                currentValue,
                startDate: investmentFormStartDate,
                notes: investmentFormNotes.trim(),
              }
            : item,
        ),
      )
    } else {
      setInvestmentPositions((previous) => [
        {
          id: generateId(),
          name,
          type: investmentFormType,
          investedAmount,
          currentValue,
          startDate: investmentFormStartDate,
          notes: investmentFormNotes.trim(),
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        ...previous,
      ])
    }

    setIsInvestmentFormOpen(false)
    resetInvestmentForm()
  }

  const handleToggleRecurringActive = async (item: RecurringTransaction) => {
    const nextIsActive = !item.isActive
    const context = await getDbContext()
    if (context) {
      const { error } = await context.db
        .from('recurring_transactions')
        .update({ is_active: nextIsActive })
        .eq('id', item.id)
      if (!error) {
        setRecurringTransactions((previous) =>
          previous.map((entry) =>
            entry.id === item.id ? { ...entry, isActive: nextIsActive } : entry,
          ),
        )
        return
      }
      console.error('Falha ao alternar recorrente no Supabase:', error)
    }

    setRecurringTransactions((previous) =>
      previous.map((entry) =>
        entry.id === item.id ? { ...entry, isActive: nextIsActive } : entry,
      ),
    )
  }

  const handleDeleteRecurring = async (id: string) => {
    const context = await getDbContext()
    if (context) {
      const { error } = await context.db
        .from('recurring_transactions')
        .delete()
        .eq('id', id)
      if (!error) {
        setRecurringTransactions((previous) => previous.filter((entry) => entry.id !== id))
        return
      }
      console.error('Falha ao excluir recorrente no Supabase:', error)
    }

    setRecurringTransactions((previous) => previous.filter((entry) => entry.id !== id))
  }

  const handleToggleInvestmentActive = async (item: InvestmentPosition) => {
    const nextIsActive = !item.isActive
    const context = await getDbContext()
    if (context) {
      const { error } = await context.db
        .from('investment_positions')
        .update({ is_active: nextIsActive })
        .eq('id', item.id)
      if (!error) {
        setInvestmentPositions((previous) =>
          previous.map((entry) =>
            entry.id === item.id ? { ...entry, isActive: nextIsActive } : entry,
          ),
        )
        return
      }
      console.error('Falha ao alternar investimento no Supabase:', error)
    }

    setInvestmentPositions((previous) =>
      previous.map((entry) =>
        entry.id === item.id ? { ...entry, isActive: nextIsActive } : entry,
      ),
    )
  }

  const handleDeleteInvestment = async (id: string) => {
    const context = await getDbContext()
    if (context) {
      const { error } = await context.db
        .from('investment_positions')
        .delete()
        .eq('id', id)
      if (!error) {
        setInvestmentPositions((previous) => previous.filter((entry) => entry.id !== id))
        return
      }
      console.error('Falha ao excluir investimento no Supabase:', error)
    }

    setInvestmentPositions((previous) => previous.filter((entry) => entry.id !== id))
  }

  const startEditingInvestment = (item: InvestmentPosition) => {
    setEditingInvestmentId(item.id)
    setInvestmentFormName(item.name)
    setInvestmentFormType(item.type)
    setInvestmentFormInvested(String(item.investedAmount))
    setInvestmentFormCurrent(String(item.currentValue))
    setInvestmentFormStartDate(item.startDate)
    setInvestmentFormNotes(item.notes)
    setIsInvestmentFormOpen(true)
  }

  const downloadReportPdf = async (
    reportType: 'monthly' | 'annual',
    fileName: string,
  ) => {
    const targetRef = reportType === 'monthly' ? monthlyReportRef : annualReportRef
    if (!targetRef.current) {
      return
    }

    setIsGeneratingPdf(reportType)

    try {
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: '#0b1430',
        scale: 2,
        useCORS: true,
      })

      const imageData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      const printableWidth = pageWidth - margin * 2
      const imageHeight = (canvas.height * printableWidth) / canvas.width

      if (imageHeight <= pageHeight - margin * 2) {
        pdf.addImage(imageData, 'PNG', margin, margin, printableWidth, imageHeight)
      } else {
        let remainingHeight = imageHeight
        let positionY = margin
        let sourceY = 0
        const ratio = canvas.width / printableWidth

        while (remainingHeight > 0) {
          const availableHeight = pageHeight - margin * 2
          const sliceHeight = Math.min(remainingHeight, availableHeight)
          const sliceCanvas = document.createElement('canvas')
          sliceCanvas.width = canvas.width
          sliceCanvas.height = Math.floor(sliceHeight * ratio)
          const context = sliceCanvas.getContext('2d')
          if (!context) {
            break
          }

          context.drawImage(
            canvas,
            0,
            Math.floor(sourceY * ratio),
            canvas.width,
            sliceCanvas.height,
            0,
            0,
            canvas.width,
            sliceCanvas.height,
          )

          const sliceData = sliceCanvas.toDataURL('image/png')
          pdf.addImage(sliceData, 'PNG', margin, positionY, printableWidth, sliceHeight)

          remainingHeight -= sliceHeight
          sourceY += sliceHeight

          if (remainingHeight > 0) {
            pdf.addPage()
            positionY = margin
          }
        }
      }

      pdf.save(fileName)
    } catch (error) {
      console.error('Erro ao gerar PDF do relatório:', error)
      window.alert('Não foi possível gerar o PDF agora. Tente novamente.')
    } finally {
      setIsGeneratingPdf(null)
    }
  }

  const sectionTitleMap: Record<
    Exclude<DashboardSectionKey, 'resumo'>,
    { title: string; description: string }
  > = {
    categorias: { title: 'Personalização', description: 'Categorias e temas' },
    metas: { title: 'Metas financeiras', description: 'Objetivos' },
    planejamento: { title: 'Planejamento mensal', description: 'Previsões' },
    recorrentes: { title: 'Transações recorrentes', description: 'Parcelamentos' },
    investimentos: { title: 'Investimentos', description: 'Acompanhamento' },
    relatorios: { title: 'Relatórios', description: 'Visão consolidada' },
    premium: { title: 'Premium', description: 'Recursos avançados' },
    configuracoes: { title: 'Configurações', description: 'Preferências' },
  }

  const renderChartCard = (extraClassName?: string) => (
    <Card className={cn('chart-evolution-glass', extraClassName)}>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardDescription className="text-[#b7cbff]">Receitas x Despesas</CardDescription>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="h-5 w-5 text-[#97b7ff]" />
            Evolucao Financeira
          </CardTitle>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-[#0a1633]/85 px-2 py-1 text-sm text-white md:self-auto">
          <button
            type="button"
            onClick={() =>
              setChartMonthCursor(
                chartMonthKeys[Math.max(0, safeChartIndex - 1)] ?? chartMonthCursor,
              )
            }
            disabled={safeChartIndex <= 0}
            className="rounded-full p-1 text-slate-200 transition hover:bg-white/10 disabled:opacity-40"
            aria-label="Ver mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[128px] text-center text-sm font-medium capitalize">
            {chartCursorLabel}
          </span>
          <button
            type="button"
            onClick={() =>
              setChartMonthCursor(
                chartMonthKeys[
                  Math.min(chartMonthKeys.length - 1, safeChartIndex + 1)
                ] ?? chartMonthCursor,
              )
            }
            disabled={safeChartIndex >= chartMonthKeys.length - 1}
            className="rounded-full p-1 text-slate-200 transition hover:bg-white/10 disabled:opacity-40"
            aria-label="Ver proximo mes"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartWindowData}>
            <defs>
              <linearGradient id="receitasGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#2AB7CA" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#2AB7CA" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="despesasGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#F28B82" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#F28B82" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#C7CCD7" />
            <XAxis
              dataKey="mes"
              stroke="#d9e7ff"
              tick={{ fill: '#ffffff', fontSize: 13 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '16px',
                borderColor: '#334155',
                background: '#0f172a',
                color: '#e2e8f0',
              }}
              labelStyle={{ color: '#cbd5e1' }}
              formatter={(value, name) => {
                const valueNumber =
                  typeof value === 'number' ? value : Number(value ?? 0)
                const isIncome = String(name).toLowerCase().includes('receita')
                const accent = isIncome ? '#22c55e' : '#ef4444'

                return [
                  <span key={`value-${name}`} style={{ color: accent }}>
                    {formatCurrency(valueNumber)}
                  </span>,
                  <span key={`label-${name}`} style={{ color: accent }}>
                    {name}
                  </span>,
                ]
              }}
            />
            <Area
              type="monotone"
              dataKey="receitas"
              stroke="#2AB7CA"
              strokeWidth={2.2}
              fill="url(#receitasGradient)"
              name="Receitas"
            />
            <Area
              type="monotone"
              dataKey="despesas"
              stroke="#F28B82"
              strokeWidth={2.2}
              fill="url(#despesasGradient)"
              name="Despesas"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )

  return (
    <main className="min-h-screen bg-[var(--m3-background)] px-4 py-8 text-[var(--m3-on-surface)] md:px-6">
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <Card className="dashboard-header-glass">
          <CardHeader className="flex flex-col gap-4 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardDescription className="text-[#c5d7ff]">Dashboard financeiro</CardDescription>
              <CardTitle className="text-2xl text-white">
                Ola, {user?.firstName ?? 'Usuario'}!
              </CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <UserButton />
            </div>
          </CardHeader>
        </Card>

        {activeSection !== 'resumo' ? renderChartCard('hidden lg:block') : null}

        {activeSection === 'resumo' ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => {
                const Icon = card.icon
                const colorClass =
                  card.tone === 'positive'
                    ? 'border-emerald-500/45 bg-emerald-500/12'
                    : 'border-rose-500/45 bg-rose-500/12'
                const textClass =
                  card.tone === 'positive' ? 'text-emerald-500' : 'text-rose-500'

                return (
                  <Card
                    key={card.title}
                    className={cn('border bg-[var(--m3-surface-container)]', colorClass)}
                  >
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center justify-between">
                        {card.title}
                        <Icon className={cn('h-4 w-4', textClass)} />
                      </CardDescription>
                      <CardTitle className={textClass}>{card.value}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-[var(--m3-on-surface-variant)]">
                        {card.detail}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {renderChartCard()}

            <div className="relative">
              <Card className="summary-section-glass">
                <CardHeader>
                  <CardTitle className="text-2xl text-white md:text-3xl">Transações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
                    <label className="col-span-2 space-y-2 text-sm xl:col-span-1">
                      <span>Busca</span>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--m3-on-surface-variant)]" />
                        <input
                          type="text"
                          value={summarySearch}
                          onChange={(event) => setSummarySearch(event.target.value)}
                          placeholder="Buscar transação..."
                          className="h-10 w-full rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface)] px-3 pl-9"
                        />
                      </div>
                    </label>

                    <label className="space-y-2 text-sm">
                      <span>Categoria</span>
                      <select
                        value={summaryCategoryFilter}
                        onChange={(event) => setSummaryCategoryFilter(event.target.value)}
                        className="h-10 w-full rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface)] px-3"
                      >
                        <option value="all">Todas as categorias</option>
                        {summaryCategoryOptions.map((category) => (
                          <option key={category.key} value={category.key}>
                            {getCategoryOptionLabel(category)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2 text-sm">
                      <span>Tipo</span>
                      <select
                        value={summaryTypeFilter}
                        onChange={(event) =>
                          setSummaryTypeFilter(event.target.value as SummaryTypeFilter)
                        }
                        className="h-10 w-full rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface)] px-3"
                      >
                        <option value="todos">Todos</option>
                        <option value="receita">Receitas</option>
                        <option value="despesa">Despesas</option>
                        <option value="recorrentes">Recorrentes</option>
                      </select>
                    </label>

                    <label className="space-y-2 text-sm">
                      <span>Mês</span>
                      <select
                        value={summaryMonthFilter}
                        onChange={(event) => setSummaryMonthFilter(event.target.value)}
                        className="h-10 w-full rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface)] px-3"
                      >
                        <option value="all">Mês</option>
                        {summaryMonthOptions.map((monthOption) => (
                          <option key={monthOption.value} value={monthOption.value}>
                            {monthOption.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2 text-sm">
                      <span>Ano</span>
                      <select
                        value={summaryYearFilter}
                        onChange={(event) => setSummaryYearFilter(event.target.value)}
                        className="h-10 w-full rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface)] px-3"
                      >
                        <option value="all">Ano</option>
                        {summaryYearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="max-h-[340px] space-y-3 overflow-y-auto pr-1">
                    {summaryItems.length === 0 ? (
                      <p className="text-sm text-[var(--m3-on-surface-variant)]">
                        Sem lancamentos para esse filtro.
                      </p>
                    ) : (
                      summaryItems.map((item) => {
                        const category = getCategoryByKey(item.categoryKey, categories)

                        return (
                          <article
                            key={item.id}
                            className="glass-surface flex items-start justify-between gap-3 rounded-2xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface)] p-4"
                          >
                            <div>
                              <p className="flex items-center gap-2 text-sm font-medium">
                                <span className="inline-flex h-4 w-4 items-center justify-center">
                                  {getCategoryDisplaySymbol(category)}
                                </span>
                                {item.categoryLabel} -{' '}
                                {item.source === 'recorrente'
                                  ? item.type === 'receita'
                                    ? 'Receita recorrente'
                                    : 'Despesa recorrente'
                                  : item.type === 'receita'
                                    ? 'Receita'
                                    : 'Despesa'}
                              </p>
                              <p className="text-sm text-[var(--m3-on-surface-variant)]">
                                {item.description ||
                                  (item.source === 'recorrente'
                                    ? `Lançamento recorrente (${formatRecurringFrequencyLabel(item.recurringFrequency ?? 'mensal')})`
                                    : 'Sem descricao')}
                              </p>
                              <p className="mt-1 text-xs text-[var(--m3-on-surface-variant)]">
                                {formatDate(item.date)}
                                {item.source === 'transacao' && item.installmentCount > 1
                                  ? ` - ${item.installmentNumber}/${item.installmentCount}x`
                                  : ''}
                              </p>
                              {item.paymentMethod ? (
                                <p className="mt-1 text-xs text-[var(--m3-on-surface-variant)]">
                                  Pagamento: {getPaymentMethodLabel(item.paymentMethod, item.cardProvider)}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <p
                                className={`text-sm font-semibold ${
                                  item.type === 'receita'
                                    ? 'text-emerald-600'
                                    : 'text-rose-600'
                                }`}
                              >
                                {item.type === 'receita' ? '+' : '-'}{' '}
                                {formatCurrency(item.value)}
                              </p>
                              {item.source === 'transacao' ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const originalTransaction = transactions.find(
                                        (entry) => entry.id === item.id,
                                      )
                                      if (originalTransaction) {
                                        onEditTransaction(originalTransaction)
                                      }
                                    }}
                                    className="rounded-full border border-[var(--m3-outline-variant)] px-3 py-1 text-xs text-[var(--m3-on-surface-variant)] transition hover:bg-[var(--m3-surface-container)]"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void onDeleteTransaction(item.id)}
                                    className="rounded-full border border-rose-500/35 px-3 py-1 text-xs text-rose-500 transition hover:bg-rose-500/15"
                                  >
                                    Excluir
                                  </button>
                                </div>
                              ) : (
                                <span className="rounded-full border border-[var(--m3-outline-variant)] px-3 py-1 text-xs text-[var(--m3-on-surface-variant)]">
                                  Recorrente
                                </span>
                              )}
                            </div>
                          </article>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card className="bg-[var(--m3-surface-container)]">
            <CardHeader>
              <CardDescription>{sectionTitleMap[activeSection].description}</CardDescription>
              <CardTitle>{sectionTitleMap[activeSection].title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {activeSection === 'categorias' ? (
                <div className="space-y-4">
                  <div className="glass-surface space-y-4 rounded-2xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface)] p-4">
                    <p className="text-base font-semibold">Categorias personalizadas</p>
                    <form
                      onSubmit={handleCreateCategorySubmit}
                      className="grid gap-3 md:grid-cols-6"
                    >
                      <label className="space-y-1 text-sm md:col-span-2">
                        <span>Tipo</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setNewCategoryType('receita')}
                            className={cn(
                              'h-10 w-full rounded-xl border text-sm font-semibold transition',
                              newCategoryType === 'receita'
                                ? 'border-emerald-600 bg-emerald-500/25 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-200'
                                : 'border-emerald-500/45 bg-transparent text-emerald-800 dark:text-emerald-300',
                            )}
                          >
                            Receita
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewCategoryType('despesa')}
                            className={cn(
                              'h-10 w-full rounded-xl border text-sm font-semibold transition',
                              newCategoryType === 'despesa'
                                ? 'border-rose-600 bg-rose-500/25 text-rose-900 dark:border-rose-500 dark:bg-rose-500/20 dark:text-rose-200'
                                : 'border-rose-500/45 bg-transparent text-rose-800 dark:text-rose-300',
                            )}
                          >
                            Despesa
                          </button>
                        </div>
                      </label>
                      <label className="space-y-1 text-sm md:col-span-1">
                        <span>Emoji</span>
                        <input
                          type="text"
                          value={newCategoryEmoji}
                          onChange={(event) => setNewCategoryEmoji(event.target.value)}
                          placeholder="Ex.: 💡"
                          className="h-10 w-full rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3"
                          required
                        />
                      </label>
                      <label className="space-y-1 text-sm md:col-span-3">
                        <span>Nome da categoria</span>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(event) => setNewCategoryName(event.target.value)}
                            placeholder="Ex.: Farmacia"
                            className="h-10 min-w-0 w-full rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 sm:flex-1"
                            required
                          />
                          <Button type="submit" className="h-10 w-full sm:w-auto">
                            Criar
                          </Button>
                        </div>
                      </label>
                    </form>

                    <div className="flex flex-wrap gap-2">
                      {categoryEmojiSuggestions.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewCategoryEmoji(emoji)}
                          className="rounded-lg border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-2 py-1 text-lg transition hover:bg-[var(--m3-surface-container)]"
                          aria-label={`Selecionar emoji ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="glass-surface space-y-4 rounded-2xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-base font-semibold">Temas do sistema</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onToggleThemeMode}
                        className="h-9"
                      >
                        {themeMode === 'dark' ? 'Modo escuro ativo' : 'Modo claro ativo'}
                      </Button>
                    </div>

                    <form
                      onSubmit={handleCreateThemeSubmit}
                      className="grid gap-3 rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] p-3 md:grid-cols-3"
                    >
                      <label className="space-y-1 text-sm md:col-span-3">
                        <span>Nome do tema</span>
                        <input
                          type="text"
                          value={newThemeName}
                          onChange={(event) => setNewThemeName(event.target.value)}
                          placeholder="Ex.: Verde Neon"
                          className="h-10 w-full rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface)] px-3"
                          required
                        />
                      </label>
                      <label className="space-y-1 text-sm">
                        <span>Cor principal</span>
                        <input
                          type="color"
                          value={newThemePrimaryColor}
                          onChange={(event) => setNewThemePrimaryColor(event.target.value)}
                          className="h-10 w-full rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface)] px-1"
                        />
                      </label>
                      <label className="space-y-1 text-sm">
                        <span>Cor de destaque</span>
                        <input
                          type="color"
                          value={newThemeAccentColor}
                          onChange={(event) => setNewThemeAccentColor(event.target.value)}
                          className="h-10 w-full rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface)] px-1"
                        />
                      </label>
                      <div className="hidden md:block" />
                      <label className="space-y-1 text-sm">
                        <span>Navbar início</span>
                        <input
                          type="color"
                          value={newThemeNavFrom}
                          onChange={(event) => setNewThemeNavFrom(event.target.value)}
                          className="h-10 w-full rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface)] px-1"
                        />
                      </label>
                      <label className="space-y-1 text-sm">
                        <span>Navbar meio</span>
                        <input
                          type="color"
                          value={newThemeNavVia}
                          onChange={(event) => setNewThemeNavVia(event.target.value)}
                          className="h-10 w-full rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface)] px-1"
                        />
                      </label>
                      <label className="space-y-1 text-sm">
                        <span>Navbar fim</span>
                        <input
                          type="color"
                          value={newThemeNavTo}
                          onChange={(event) => setNewThemeNavTo(event.target.value)}
                          className="h-10 w-full rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface)] px-1"
                        />
                      </label>
                      <div className="md:col-span-3">
                        <Button type="submit" className="h-10 w-full">
                          Criar tema
                        </Button>
                      </div>
                    </form>

                    <div className="grid gap-3">
                      {themePresets.map((theme) => {
                        const isActiveTheme = theme.id === activeThemeId
                        return (
                          <article
                            key={theme.id}
                            className="rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold">
                                {theme.name}
                                {isActiveTheme ? ' · Ativo' : ''}
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => onApplyTheme(theme.id)}
                                  className="h-8 px-3 text-xs"
                                >
                                  Aplicar
                                </Button>
                                {theme.id !== defaultThemePreset.id ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onDeleteTheme(theme.id)}
                                    className="h-8 border-rose-500/45 px-3 text-xs text-rose-400 hover:bg-rose-500/15"
                                  >
                                    Excluir
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                            <div className="mt-3 flex h-3 overflow-hidden rounded-full">
                              <span
                                className="block h-full flex-1"
                                style={{ backgroundColor: theme.navFrom }}
                              />
                              <span
                                className="block h-full flex-1"
                                style={{ backgroundColor: theme.navVia }}
                              />
                              <span
                                className="block h-full flex-1"
                                style={{ backgroundColor: theme.navTo }}
                              />
                              <span
                                className="block h-full w-10"
                                style={{ backgroundColor: theme.accentColor }}
                              />
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : null}

              {activeSection === 'metas' ? (
                <div className="space-y-4">
                  <div className="glass-surface meta-blue-card rounded-2xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="meta-blue-strong flex items-center gap-2 text-lg font-semibold">
                        <Target className="h-5 w-5 text-[#97B7FF]" />
                        Metas Financeiras
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsGoalFormOpen((previous) => !previous)}
                        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
                      >
                        + Nova Meta
                      </button>
                    </div>

                    {isGoalFormOpen ? (
                      <form
                        onSubmit={handleCreateGoalSubmit}
                        className="glass-surface meta-blue-card mt-4 grid gap-3 rounded-xl border p-3 md:grid-cols-4"
                      >
                        <input
                          type="text"
                          value={newGoalName}
                          onChange={(event) => setNewGoalName(event.target.value)}
                          placeholder="Nome da meta"
                          className="meta-blue-input h-10 rounded-lg border px-3 text-sm"
                          required
                        />
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={newGoalValue}
                          onChange={(event) => setNewGoalValue(event.target.value)}
                          placeholder="Valor alvo"
                          className="meta-blue-input h-10 rounded-lg border px-3 text-sm"
                          required
                        />
                        <input
                          type="date"
                          value={newGoalDate}
                          onChange={(event) => setNewGoalDate(event.target.value)}
                          className="meta-blue-input h-10 rounded-lg border px-3 text-sm"
                          required
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="h-10 flex-1 rounded-lg bg-emerald-500 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsGoalFormOpen(false)}
                            className="h-10 rounded-lg border border-[#4f6fb4] px-3 text-sm text-[#c5d7ff] transition hover:bg-[#1b366a]"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : null}
                  </div>

                  {goals.length === 0 ? (
                    <p className="text-sm text-[var(--m3-on-surface-variant)]">
                      Nenhuma meta criada ainda.
                    </p>
                  ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                      {goals.map((goal) => {
                        const progress = Math.min(
                          100,
                          (goal.currentAmount / goal.targetAmount) * 100,
                        )
                        const daysRemaining = getDaysRemaining(goal.targetDate)
                        const isEditing = editingGoalId === goal.id

                        return (
                          <div
                            key={goal.id}
                            className="glass-surface meta-blue-card space-y-3 rounded-xl border p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="meta-blue-strong flex items-center gap-2 text-base font-semibold">
                                <Target className="meta-blue-muted h-4 w-4" />
                                {goal.name}
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEditingGoal(goal)}
                                  className="rounded-md border border-[#4f6fb4] p-2 text-[#d6e3ff] transition hover:bg-[#1b366a]"
                                  aria-label="Editar meta"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteGoal(goal.id)}
                                  className="rounded-md border border-[#4f6fb4] p-2 text-[#d6e3ff] transition hover:bg-[#1b366a]"
                                  aria-label="Excluir meta"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {isEditing ? (
                              <div className="grid gap-2 md:grid-cols-3">
                                <input
                                  type="text"
                                  value={editingGoalName}
                                  onChange={(event) => setEditingGoalName(event.target.value)}
                                  className="meta-blue-input h-10 rounded-lg border px-3 text-sm"
                                />
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={editingGoalValue}
                                  onChange={(event) => setEditingGoalValue(event.target.value)}
                                  className="meta-blue-input h-10 rounded-lg border px-3 text-sm"
                                />
                                <input
                                  type="date"
                                  value={editingGoalDate}
                                  onChange={(event) => setEditingGoalDate(event.target.value)}
                                  className="meta-blue-input h-10 rounded-lg border px-3 text-sm"
                                />
                                <div className="flex gap-2 md:col-span-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const parsedValue = Number(
                                        editingGoalValue.replace(',', '.'),
                                      )
                                      if (
                                        !editingGoalName.trim() ||
                                        !Number.isFinite(parsedValue) ||
                                        parsedValue <= 0 ||
                                        !editingGoalDate
                                      ) {
                                        return
                                      }
                                      onUpdateGoal({
                                        ...goal,
                                        name: editingGoalName.trim(),
                                        targetAmount: parsedValue,
                                        targetDate: editingGoalDate,
                                      })
                                      setEditingGoalId(null)
                                    }}
                                    className="h-10 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
                                  >
                                    Salvar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingGoalId(null)}
                                    className="h-10 rounded-lg border border-[#4f6fb4] px-4 text-sm text-[#c5d7ff] transition hover:bg-[#1b366a]"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="space-y-2">
                                  <div className="meta-blue-muted flex items-center justify-between text-xs">
                                    <span>Progresso</span>
                                    <span>{progress.toFixed(1)}%</span>
                                  </div>
                                  <div className="h-2 overflow-hidden rounded-full bg-[#0d2047]">
                                    <div
                                      className="h-full rounded-full bg-emerald-500 transition-all"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-emerald-500">
                                      {formatCurrency(goal.currentAmount)}
                                    </span>
                                    <span className="meta-blue-muted">
                                      {formatCurrency(goal.targetAmount)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-emerald-400">
                                      {daysRemaining >= 0
                                        ? `${daysRemaining} dias restantes`
                                        : `${Math.abs(daysRemaining)} dias de atraso`}
                                    </span>
                                    <span className="meta-blue-muted">
                                      {formatDate(goal.targetDate)}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex gap-2 pt-1">
                                  <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={goalContribution[goal.id] ?? ''}
                                    onChange={(event) =>
                                      setGoalContribution((previous) => ({
                                        ...previous,
                                        [goal.id]: event.target.value,
                                      }))
                                    }
                                    placeholder="Valor"
                                    className="meta-blue-input h-10 flex-1 rounded-lg border px-3 text-sm"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const parsed = Number(
                                        (goalContribution[goal.id] ?? '').replace(',', '.'),
                                      )
                                      if (!Number.isFinite(parsed) || parsed <= 0) {
                                        return
                                      }
                                      onAddGoalAmount(goal.id, parsed)
                                      setGoalContribution((previous) => ({
                                        ...previous,
                                        [goal.id]: '',
                                      }))
                                    }}
                                    className="h-10 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
                                  >
                                    $ Adicionar
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : null}

              {activeSection === 'planejamento' ? (
                <div className="space-y-4">
                  <div className="glass-surface meta-blue-card rounded-2xl border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <p className="flex items-center gap-2 text-lg font-semibold">
                        <CalendarDays className="h-5 w-5 text-[var(--m3-primary)]" />
                        Planejamento Mensal
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={planningMonthKey}
                          onChange={(event) => setPlanningMonthKey(event.target.value)}
                          className="h-10 rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 text-sm"
                        >
                          {planningMonthOptions.map((monthKey) => (
                            <option key={monthKey} value={monthKey}>
                              {formatMonthTitle(monthKey)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setIsPlanFormOpen((previous) => !previous)}
                          className="h-10 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
                        >
                          + Novo Planejamento
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="glass-surface meta-blue-card rounded-2xl border p-4">
                    <p className="text-lg font-semibold">
                      Resumo - {formatMonthTitle(planningMonthKey)}
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-[var(--m3-on-surface-variant)]">Planejado</p>
                        <p className="text-2xl font-semibold text-[var(--m3-primary)]">
                          {formatCurrency(planningTotalPlanned)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--m3-on-surface-variant)]">Gasto</p>
                        <p className="text-2xl font-semibold text-rose-500">
                          {formatCurrency(planningTotalSpent)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--m3-on-surface-variant)]">Saldo</p>
                        <p
                          className={cn(
                            'text-2xl font-semibold',
                            planningTotalBalance >= 0 ? 'text-emerald-500' : 'text-rose-500',
                          )}
                        >
                          {formatCurrency(planningTotalBalance)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1">
                      <div className="flex items-center justify-between text-xs text-[var(--m3-on-surface-variant)]">
                        <span>Progresso do Mês</span>
                        <span>{planningProgressPercent.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--m3-surface-container-low)]">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${planningProgressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {isPlanFormOpen ? (
                    <form
                      onSubmit={handleCreatePlanSubmit}
                      className="glass-surface meta-blue-card grid gap-3 rounded-2xl border p-4 md:grid-cols-4"
                    >
                      <input
                        type="text"
                        value={newPlanName}
                        onChange={(event) => setNewPlanName(event.target.value)}
                        placeholder="Nome (ex.: Cartao)"
                        className="h-10 rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 text-sm md:col-span-2"
                        required
                      />
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={newPlanAmount}
                        onChange={(event) => setNewPlanAmount(event.target.value)}
                        placeholder="Valor planejado"
                        className="h-10 rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 text-sm"
                        required
                      />
                      <select
                        value={newPlanCategoryKey}
                        onChange={(event) => setNewPlanCategoryKey(event.target.value)}
                        className="h-10 rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 text-sm"
                      >
                        <option value="all_expenses">Todas as despesas</option>
                        {expenseCategoriesView.map((category) => (
                          <option key={category.key} value={category.key}>
                            {getCategoryOptionLabel(category)}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2 md:col-span-4 md:justify-end">
                        <button
                          type="button"
                          onClick={() => setIsPlanFormOpen(false)}
                          className="h-10 rounded-xl border border-[var(--m3-outline-variant)] px-4 text-sm"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="h-10 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
                        >
                          Salvar planejamento
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {plansForMonth.length === 0 ? (
                    <p className="text-sm text-[var(--m3-on-surface-variant)]">
                      Nenhum planejamento criado para esse mes.
                    </p>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {plansForMonth.map((plan) => {
                        const spent = getPlanSpent(plan)
                        const balanceValue = plan.plannedAmount - spent
                        const progress = Math.min((spent / plan.plannedAmount) * 100, 100)
                        const category =
                          plan.categoryKey === 'all_expenses'
                            ? null
                            : getCategoryByKey(plan.categoryKey, categories)
                        const isEditingPlan = editingPlanId === plan.id

                        return (
                          <div
                            key={plan.id}
                            className="glass-surface meta-blue-card space-y-3 rounded-2xl border p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xl font-semibold">{plan.name}</p>
                                <p className="text-xs text-[var(--m3-on-surface-variant)]">
                                  {category
                                    ? `${getCategoryOptionLabel(category)}`
                                    : 'Todas as despesas'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEditingPlan(plan)}
                                  className="rounded-md border border-[var(--m3-outline-variant)] p-2 text-[var(--m3-on-surface-variant)] transition hover:bg-[var(--m3-surface-container)]"
                                  aria-label="Editar planejamento"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setMonthlyPlans((previous) =>
                                      previous.filter((item) => item.id !== plan.id),
                                    )
                                  }
                                  className="rounded-md border border-[var(--m3-outline-variant)] p-2 text-[var(--m3-on-surface-variant)] transition hover:bg-[var(--m3-surface-container)]"
                                  aria-label="Excluir planejamento"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {isEditingPlan ? (
                              <div className="grid gap-2 md:grid-cols-3">
                                <input
                                  type="text"
                                  value={editingPlanName}
                                  onChange={(event) => setEditingPlanName(event.target.value)}
                                  className="h-10 rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 text-sm"
                                />
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={editingPlanAmount}
                                  onChange={(event) => setEditingPlanAmount(event.target.value)}
                                  className="h-10 rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 text-sm"
                                />
                                <select
                                  value={editingPlanCategoryKey}
                                  onChange={(event) =>
                                    setEditingPlanCategoryKey(event.target.value)
                                  }
                                  className="h-10 rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 text-sm"
                                >
                                  <option value="all_expenses">Todas as despesas</option>
                                  {expenseCategoriesView.map((categoryOption) => (
                                    <option
                                      key={categoryOption.key}
                                      value={categoryOption.key}
                                    >
                                      {categoryOption.emoji} {categoryOption.label}
                                    </option>
                                  ))}
                                </select>
                                <div className="flex gap-2 md:col-span-3 md:justify-end">
                                  <button
                                    type="button"
                                    onClick={() => setEditingPlanId(null)}
                                    className="h-10 rounded-xl border border-[var(--m3-outline-variant)] px-4 text-sm"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSavePlanEdit(plan)}
                                    className="h-10 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
                                  >
                                    Salvar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs text-[var(--m3-on-surface-variant)]">
                                    <span>Progresso</span>
                                    <span>{progress.toFixed(1)}%</span>
                                  </div>
                                  <div className="h-2 overflow-hidden rounded-full bg-[var(--m3-surface-container-low)]">
                                    <div
                                      className="h-full rounded-full bg-emerald-500 transition-all"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-[var(--m3-on-surface-variant)]">
                                    <span>Gasto: {formatCurrency(spent)}</span>
                                    <span>Planejado: {formatCurrency(plan.plannedAmount)}</span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-[var(--m3-outline-variant)] pt-3">
                                  <p className="text-sm font-semibold">Saldo:</p>
                                  <p
                                    className={cn(
                                      'text-lg font-semibold',
                                      balanceValue >= 0
                                        ? 'text-emerald-500'
                                        : 'text-rose-500',
                                    )}
                                  >
                                    {formatCurrency(balanceValue)}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : null}

              {activeSection === 'recorrentes' ? (
                <div className="space-y-4">
                  <div className="glass-surface meta-blue-card rounded-2xl border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <p className="flex items-center gap-2 text-lg font-semibold">
                        <Repeat className="h-5 w-5 text-[var(--m3-primary)]" />
                        Transações Recorrentes
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isRecurringFormOpen) {
                            resetRecurringForm()
                          }
                          setIsRecurringFormOpen((previous) => !previous)
                        }}
                        className="h-10 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
                      >
                        + Nova Transação Recorrente
                      </button>
                    </div>
                  </div>

                  <div className="glass-surface meta-blue-card space-y-3 rounded-2xl border p-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <p className="text-sm">
                        Entradas:{' '}
                        <span className="font-semibold text-emerald-500">
                          {formatCurrency(recurringIncome)}
                        </span>
                      </p>
                      <p className="text-sm">
                        Saídas:{' '}
                        <span className="font-semibold text-rose-500">
                          {formatCurrency(recurringExpense)}
                        </span>
                      </p>
                      <p className="text-sm sm:text-right">
                        Sobra:{' '}
                        <span
                          className={cn(
                            'font-semibold',
                            recurringBalance >= 0 ? 'text-emerald-500' : 'text-rose-500',
                          )}
                        >
                          {formatCurrency(recurringBalance)}
                        </span>
                      </p>
                    </div>
                    <p className="text-sm text-[var(--m3-on-surface-variant)]">
                      Este é o valor mensal estimado após pagar todos os compromissos
                      fixos ativos.
                    </p>
                  </div>

                  {isRecurringFormOpen ? (
                    <form
                      onSubmit={handleCreateOrUpdateRecurring}
                      className="glass-surface meta-blue-card grid gap-3 rounded-2xl border p-4 md:grid-cols-2"
                    >
                      <input
                        type="text"
                        value={recurringFormName}
                        onChange={(event) => setRecurringFormName(event.target.value)}
                        placeholder="Nome (ex.: Netflix, Salário)"
                        className="h-10 rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 text-sm"
                        required
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRecurringFormType('receita')}
                          className={cn(
                            'h-10 rounded-xl border text-sm font-semibold transition',
                            recurringFormType === 'receita'
                              ? 'border-emerald-500 bg-emerald-600 text-white'
                              : 'border-emerald-500/45 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                          )}
                        >
                          Receita
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecurringFormType('despesa')}
                          className={cn(
                            'h-10 rounded-xl border text-sm font-semibold transition',
                            recurringFormType === 'despesa'
                              ? 'border-rose-500 bg-rose-600 text-white'
                              : 'border-rose-500/45 bg-rose-500/10 text-rose-700 dark:text-rose-300',
                          )}
                        >
                          Despesa
                        </button>
                      </div>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={recurringFormAmount}
                        onChange={(event) => setRecurringFormAmount(event.target.value)}
                        placeholder="Valor"
                        className="h-10 rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 text-sm"
                        required
                      />
                      <select
                        value={recurringFormCategoryKey}
                        onChange={(event) => setRecurringFormCategoryKey(event.target.value)}
                        className="h-10 rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 text-sm"
                        required
                      >
                        {recurringCategoryOptions.map((category) => (
                          <option key={category.key} value={category.key}>
                            {getCategoryOptionLabel(category)}
                          </option>
                        ))}
                      </select>
                      <select
                        value={recurringFormFrequency}
                        onChange={(event) =>
                          setRecurringFormFrequency(
                            event.target.value as RecurringFrequency,
                          )
                        }
                        className="h-10 rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 text-sm"
                      >
                        <option value="semanal">Semanal</option>
                        <option value="quinzenal">Quinzenal</option>
                        <option value="mensal">Mensal</option>
                        <option value="anual">Anual</option>
                      </select>
                      <input
                        type="date"
                        value={recurringFormNextDate}
                        onChange={(event) => setRecurringFormNextDate(event.target.value)}
                        className="h-10 rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 text-sm"
                        required
                      />
                      <select
                        value={recurringFormPaymentMethod}
                        onChange={(event) => {
                          const value = event.target.value as '' | PaymentMethod
                          setRecurringFormPaymentMethod(value)
                          if (value !== 'cartao') {
                            setRecurringFormCardProvider('')
                          }
                        }}
                        className="h-10 rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 text-sm"
                      >
                        <option value="">Forma de pagamento (opcional)</option>
                        <option value="pix">Pix</option>
                        <option value="cartao">Cartao</option>
                      </select>
                      {recurringFormPaymentMethod === 'cartao' ? (
                        <select
                          value={recurringFormCardProvider}
                          onChange={(event) =>
                            setRecurringFormCardProvider(
                              event.target.value as '' | CardProvider,
                            )
                          }
                          className="h-10 rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 text-sm"
                          required
                        >
                          <option value="">Selecione o cartão</option>
                          {cardProviderOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.emoji} {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div />
                      )}
                      <input
                        type="text"
                        value={recurringFormDescription}
                        onChange={(event) => setRecurringFormDescription(event.target.value)}
                        placeholder="Descrição (opcional)"
                        className="h-10 rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 text-sm md:col-span-2"
                      />
                      <div className="flex gap-2 md:col-span-2 md:justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setIsRecurringFormOpen(false)
                            resetRecurringForm()
                          }}
                          className="h-10 rounded-xl border border-[var(--m3-outline-variant)] px-4 text-sm"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="h-10 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
                        >
                          {editingRecurringId ? 'Salvar alterações' : 'Salvar recorrente'}
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {sortedRecurringTransactions.length === 0 ? (
                    <p className="text-sm text-[var(--m3-on-surface-variant)]">
                      Nenhuma transação recorrente cadastrada ainda.
                    </p>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {sortedRecurringTransactions.map((item) => {
                        const category = getCategoryByKey(item.categoryKey, categories)

                        return (
                          <article
                            key={item.id}
                            className="glass-surface meta-blue-card space-y-3 rounded-2xl border p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-lg font-semibold">
                                  {category?.emoji ?? '📌'} {item.name}
                                </p>
                                <p className="text-sm text-[var(--m3-on-surface-variant)]">
                                  {category?.label ?? 'Categoria'} ·{' '}
                                  {formatRecurringFrequencyLabel(item.frequency)}
                                </p>
                                {item.paymentMethod ? (
                                  <p className="text-xs text-[var(--m3-on-surface-variant)]">
                                    Pagamento: {getPaymentMethodLabel(item.paymentMethod, item.cardProvider)}
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => void handleToggleRecurringActive(item)}
                                  className={cn(
                                    'relative h-6 w-11 rounded-full border transition',
                                    item.isActive
                                      ? 'border-emerald-500/60 bg-emerald-500'
                                      : 'border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)]',
                                  )}
                                  aria-label={
                                    item.isActive
                                      ? 'Desativar recorrência'
                                      : 'Ativar recorrência'
                                  }
                                >
                                  <span
                                    className={cn(
                                      'absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white transition',
                                      item.isActive ? 'left-[22px]' : 'left-0.5',
                                    )}
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startEditingRecurring(item)}
                                  className="rounded-md border border-[var(--m3-outline-variant)] p-2 text-[var(--m3-on-surface-variant)] transition hover:bg-[var(--m3-surface-container)]"
                                  aria-label="Editar recorrente"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteRecurring(item.id)}
                                  className="rounded-md border border-[var(--m3-outline-variant)] p-2 text-[var(--m3-on-surface-variant)] transition hover:bg-[var(--m3-surface-container)]"
                                  aria-label="Excluir recorrente"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            <p
                              className={cn(
                                'text-3xl font-semibold',
                                item.type === 'receita' ? 'text-emerald-500' : 'text-rose-500',
                              )}
                            >
                              {item.type === 'receita' ? '+' : '-'}
                              {formatCurrency(item.amount)}
                            </p>

                            <div className="flex items-center justify-between text-sm">
                              <p className="flex items-center gap-2 text-[var(--m3-on-surface-variant)]">
                                <CalendarDays className="h-4 w-4" />
                                Próxima: {formatDate(item.nextDueDate)}
                              </p>
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    'rounded-full px-2 py-1 text-xs font-semibold',
                                    item.type === 'receita'
                                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                                      : 'bg-rose-500/20 text-rose-600 dark:text-rose-300',
                                  )}
                                >
                                  {item.type === 'receita' ? 'Entrada' : 'Saída'}
                                </span>
                                <span
                                  className={cn(
                                    'rounded-full px-2 py-1 text-xs font-semibold',
                                    item.isActive
                                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                                      : 'bg-slate-500/20 text-slate-600 dark:text-slate-300',
                                  )}
                                >
                                  {item.isActive ? 'Ativo' : 'Pausado'}
                                </span>
                              </div>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : null}

              {activeSection === 'investimentos' ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="glass-surface meta-blue-card rounded-2xl border p-4">
                      <p className="text-xs text-[var(--m3-on-surface-variant)]">
                        Total investido
                      </p>
                      <p className="text-2xl font-semibold text-[var(--m3-primary)]">
                        {formatCurrency(investmentTotals.totalInvested)}
                      </p>
                    </div>
                    <div className="glass-surface meta-blue-card rounded-2xl border p-4">
                      <p className="text-xs text-[var(--m3-on-surface-variant)]">Valor atual</p>
                      <p className="text-2xl font-semibold text-emerald-500">
                        {formatCurrency(investmentTotals.totalCurrent)}
                      </p>
                    </div>
                    <div className="glass-surface meta-blue-card rounded-2xl border p-4">
                      <p className="text-xs text-[var(--m3-on-surface-variant)]">Retorno</p>
                      <p
                        className={cn(
                          'text-2xl font-semibold',
                          investmentTotals.returnValue >= 0
                            ? 'text-emerald-500'
                            : 'text-rose-500',
                        )}
                      >
                        {formatCurrency(investmentTotals.returnValue)}
                      </p>
                      <p className="text-xs text-[var(--m3-on-surface-variant)]">
                        {investmentTotals.returnPercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  <div className="glass-surface meta-blue-card rounded-2xl border p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <p className="flex items-center gap-2 text-lg font-semibold">
                        <LineChart className="h-5 w-5 text-[var(--m3-primary)]" />
                        Meus Investimentos
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isInvestmentFormOpen) {
                            resetInvestmentForm()
                          }
                          setIsInvestmentFormOpen((previous) => !previous)
                        }}
                        className="h-10 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
                      >
                        + Novo Investimento
                      </button>
                    </div>
                  </div>

                  <div className="glass-surface meta-blue-card space-y-3 rounded-2xl border p-4">
                    <p className="text-sm text-[var(--m3-on-surface-variant)]">
                      Visão rápida de carteira
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface)] p-3">
                        <p className="text-xs text-[var(--m3-on-surface-variant)]">
                          Melhor posição
                        </p>
                        {topInvestment ? (
                          <p className="mt-1 text-sm font-semibold">
                            {getInvestmentTypeEmoji(topInvestment.type)} {topInvestment.name} ·{' '}
                            <span className="text-emerald-500">
                              {formatCurrency(
                                topInvestment.currentValue - topInvestment.investedAmount,
                              )}
                            </span>
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-[var(--m3-on-surface-variant)]">
                            Sem posições ativas.
                          </p>
                        )}
                      </div>
                      <div className="rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface)] p-3">
                        <p className="text-xs text-[var(--m3-on-surface-variant)]">
                          Distribuição por tipo
                        </p>
                        {investmentByType.length === 0 ? (
                          <p className="mt-1 text-sm text-[var(--m3-on-surface-variant)]">
                            Sem dados de alocação.
                          </p>
                        ) : (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {investmentByType.map((item) => (
                              <span
                                key={item.type}
                                className="rounded-full border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-2 py-1 text-xs"
                              >
                                {getInvestmentTypeEmoji(item.type)} {getInvestmentTypeLabel(item.type)} ·{' '}
                                {formatCurrency(item.amount)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {isInvestmentFormOpen ? (
                    <form
                      onSubmit={handleCreateOrUpdateInvestment}
                      className="glass-surface meta-blue-card grid gap-3 rounded-2xl border p-4 md:grid-cols-2"
                    >
                      <input
                        type="text"
                        value={investmentFormName}
                        onChange={(event) => setInvestmentFormName(event.target.value)}
                        placeholder="Nome (ex.: Petrobras, Bitcoin)"
                        className="h-10 rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 text-sm"
                        required
                      />
                      <select
                        value={investmentFormType}
                        onChange={(event) =>
                          setInvestmentFormType(event.target.value as InvestmentType)
                        }
                        className="h-10 rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 text-sm"
                      >
                        {investmentTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.emoji} {option.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={investmentFormInvested}
                        onChange={(event) => setInvestmentFormInvested(event.target.value)}
                        placeholder="Valor investido"
                        className="h-10 rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 text-sm"
                        required
                      />
                      <input
                        type="number"
                        min="0.00"
                        step="0.01"
                        value={investmentFormCurrent}
                        onChange={(event) => setInvestmentFormCurrent(event.target.value)}
                        placeholder="Valor atual"
                        className="h-10 rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 text-sm"
                        required
                      />
                      <input
                        type="date"
                        value={investmentFormStartDate}
                        onChange={(event) => setInvestmentFormStartDate(event.target.value)}
                        className="h-10 rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 text-sm"
                        required
                      />
                      <input
                        type="text"
                        value={investmentFormNotes}
                        onChange={(event) => setInvestmentFormNotes(event.target.value)}
                        placeholder="Observação (opcional)"
                        className="h-10 rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 text-sm"
                      />
                      <div className="flex gap-2 md:col-span-2 md:justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setIsInvestmentFormOpen(false)
                            resetInvestmentForm()
                          }}
                          className="h-10 rounded-xl border border-[var(--m3-outline-variant)] px-4 text-sm"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="h-10 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
                        >
                          {editingInvestmentId ? 'Salvar alterações' : 'Salvar investimento'}
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {sortedInvestmentPositions.length === 0 ? (
                    <p className="text-sm text-[var(--m3-on-surface-variant)]">
                      Nenhum investimento cadastrado ainda.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {sortedInvestmentPositions.map((item) => {
                        const returnValue = item.currentValue - item.investedAmount
                        const returnPercent =
                          item.investedAmount > 0
                            ? (returnValue / item.investedAmount) * 100
                            : 0

                        return (
                          <article
                            key={item.id}
                            className="glass-surface meta-blue-card rounded-2xl border p-4"
                          >
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="text-lg font-semibold">
                                  {getInvestmentTypeEmoji(item.type)} {item.name}
                                </p>
                                <p className="text-sm text-[var(--m3-on-surface-variant)]">
                                  <span className="rounded-full border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-2 py-0.5 text-xs">
                                    {getInvestmentTypeLabel(item.type)}
                                  </span>
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => void handleToggleInvestmentActive(item)}
                                  className={cn(
                                    'relative h-6 w-11 rounded-full border transition',
                                    item.isActive
                                      ? 'border-emerald-500/60 bg-emerald-500'
                                      : 'border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)]',
                                  )}
                                  aria-label={
                                    item.isActive
                                      ? 'Desativar investimento'
                                      : 'Ativar investimento'
                                  }
                                >
                                  <span
                                    className={cn(
                                      'absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white transition',
                                      item.isActive ? 'left-[22px]' : 'left-0.5',
                                    )}
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startEditingInvestment(item)}
                                  className="rounded-md border border-[var(--m3-outline-variant)] p-2 text-[var(--m3-on-surface-variant)] transition hover:bg-[var(--m3-surface-container)]"
                                  aria-label="Editar investimento"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteInvestment(item.id)}
                                  className="rounded-md border border-[var(--m3-outline-variant)] p-2 text-[var(--m3-on-surface-variant)] transition hover:bg-[var(--m3-surface-container)]"
                                  aria-label="Excluir investimento"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            <div className="mt-3 grid gap-3 text-sm md:grid-cols-4">
                              <p>
                                Investido:{' '}
                                <span className="font-semibold">
                                  {formatCurrency(item.investedAmount)}
                                </span>
                              </p>
                              <p>
                                Atual:{' '}
                                <span className="font-semibold text-emerald-500">
                                  {formatCurrency(item.currentValue)}
                                </span>
                              </p>
                              <p>
                                Retorno:{' '}
                                <span
                                  className={cn(
                                    'font-semibold',
                                    returnValue >= 0 ? 'text-emerald-500' : 'text-rose-500',
                                  )}
                                >
                                  {formatCurrency(returnValue)} ({returnPercent.toFixed(2)}%)
                                </span>
                              </p>
                              <p className="text-[var(--m3-on-surface-variant)]">
                                Data: {formatDate(item.startDate)}
                              </p>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : null}

              {activeSection === 'relatorios' ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        downloadReportPdf('monthly', `relatorio-mensal-${reportYear}-${reportMonth}.pdf`)
                      }
                      disabled={isGeneratingPdf !== null}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-4 py-2 text-sm font-medium text-[var(--m3-on-surface)] transition hover:bg-[var(--m3-surface-container)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Download className="h-4 w-4" />
                      {isGeneratingPdf === 'monthly' ? 'Gerando PDF...' : 'Baixar PDF mensal'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadReportPdf('annual', `relatorio-anual-${annualReportYear}.pdf`)
                      }
                      disabled={isGeneratingPdf !== null}
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-600/55 bg-emerald-500/22 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-500/30 dark:border-emerald-500/45 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Download className="h-4 w-4" />
                      {isGeneratingPdf === 'annual' ? 'Gerando PDF...' : 'Baixar PDF anual'}
                    </button>
                  </div>

                  <section ref={monthlyReportRef} className="space-y-4">
                    <div className="glass-surface meta-blue-card rounded-2xl border p-4 md:p-5">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-white">Gastos por Categoria</h3>
                        <div className="flex items-center gap-2">
                          <select
                            value={reportMonth}
                            onChange={(event) => setReportMonth(event.target.value)}
                            className="h-9 rounded-lg border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 text-sm text-[var(--m3-on-surface)]"
                          >
                            {summaryMonthOptions.map((item) => (
                              <option key={item.value} value={item.value}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                          <select
                            value={reportYear}
                            onChange={(event) => setReportYear(event.target.value)}
                            className="h-9 rounded-lg border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3 text-sm text-[var(--m3-on-surface)]"
                          >
                            {reportYearOptions.map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
                        <div className="h-[280px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={expenseCategoryData}
                                dataKey="value"
                                nameKey="label"
                                cx="50%"
                                cy="50%"
                                outerRadius={95}
                                innerRadius={0}
                              >
                                {expenseCategoryData.map((entry) => (
                                  <Cell key={entry.label} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value) => formatCurrency(Number(value ?? 0))}
                                contentStyle={{
                                  borderRadius: '12px',
                                  borderColor: 'rgba(151,183,255,0.35)',
                                  backgroundColor: 'rgba(10,24,52,0.95)',
                                  color: '#eaf0ff',
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-3 pt-1">
                          {expenseCategoryData.length === 0 ? (
                            <p className="text-sm text-[var(--m3-on-surface-variant)]">
                              Sem despesas no período selecionado.
                            </p>
                          ) : (
                            expenseCategoryData.map((item) => (
                              <div
                                key={item.label}
                                className="flex items-center justify-between gap-2 text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <span>{item.label}</span>
                                </div>
                                <span className="font-semibold">
                                  {item.percent.toFixed(1)}% ({formatCurrency(item.value)})
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="glass-surface meta-blue-card rounded-2xl border p-4 md:p-5">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-white">
                          Gastos Recorrentes por Categoria
                        </h3>
                        <div className="inline-flex rounded-full border border-[var(--m3-outline-variant)] p-1">
                          <button
                            type="button"
                            onClick={() => setRecurringReportMode('mensal')}
                            className={cn(
                              'rounded-full px-3 py-1 text-xs font-medium transition',
                              recurringReportMode === 'mensal'
                                ? 'bg-emerald-500 text-emerald-950'
                                : 'text-[var(--m3-on-surface-variant)]',
                            )}
                          >
                            Mensal
                          </button>
                          <button
                            type="button"
                            onClick={() => setRecurringReportMode('anual')}
                            className={cn(
                              'rounded-full px-3 py-1 text-xs font-medium transition',
                              recurringReportMode === 'anual'
                                ? 'bg-emerald-500 text-emerald-950'
                                : 'text-[var(--m3-on-surface-variant)]',
                            )}
                          >
                            Anual
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-[minmax(0,460px)_1fr]">
                        <div className="h-[290px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={recurringCategoryData}
                                dataKey="value"
                                nameKey="label"
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={110}
                              >
                                {recurringCategoryData.map((entry) => (
                                  <Cell key={entry.label} fill={entry.color} />
                                ))}
                              </Pie>
                              <Pie
                                data={[{ value: recurringTotalValue || 1 }]}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                innerRadius={0}
                                outerRadius={48}
                                fill="rgba(10,24,52,0.88)"
                                isAnimationActive={false}
                              />
                              <Tooltip
                                formatter={(value) => formatCurrency(Number(value ?? 0))}
                                contentStyle={{
                                  borderRadius: '12px',
                                  borderColor: 'rgba(151,183,255,0.35)',
                                  backgroundColor: 'rgba(10,24,52,0.95)',
                                  color: '#eaf0ff',
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-3">
                          <div className="rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] p-3 text-center">
                            <p className="text-sm text-[var(--m3-on-surface-variant)]">
                              Gasto {recurringReportMode}
                            </p>
                            <p className="text-2xl font-semibold text-white">
                              {formatCurrency(recurringTotalValue)}
                            </p>
                            <p className="text-xs text-[var(--m3-on-surface-variant)]">
                              {recurringCategoryData.length} categorias
                            </p>
                          </div>
                          <div className="space-y-2">
                            {recurringCategoryData.length === 0 ? (
                              <p className="text-sm text-[var(--m3-on-surface-variant)]">
                                Nenhuma recorrência ativa cadastrada.
                              </p>
                            ) : (
                              recurringCategoryData.map((item) => (
                                <div
                                  key={item.label}
                                  className="flex items-center justify-between gap-2 text-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="h-3 w-3 rounded-full"
                                      style={{ backgroundColor: item.color }}
                                    />
                                    <span>{item.label}</span>
                                  </div>
                                  <span className="font-semibold">{formatCurrency(item.value)}</span>
                                </div>
                              ))
                            )}
                          </div>
                          <div className="grid gap-2 sm:grid-cols-3">
                            <div className="rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] p-2 text-center">
                              <p className="text-xs text-[var(--m3-on-surface-variant)]">
                                Total mensal
                              </p>
                              <p className="font-semibold text-white">
                                {formatCurrency(
                                  recurringReportMode === 'mensal'
                                    ? recurringTotalValue
                                    : recurringTotalValue / 12,
                                )}
                              </p>
                            </div>
                            <div className="rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] p-2 text-center">
                              <p className="text-xs text-[var(--m3-on-surface-variant)]">Total anual</p>
                              <p className="font-semibold text-white">
                                {formatCurrency(
                                  recurringReportMode === 'mensal'
                                    ? recurringTotalValue * 12
                                    : recurringTotalValue,
                                )}
                              </p>
                            </div>
                            <div className="rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] p-2 text-center">
                              <p className="text-xs text-[var(--m3-on-surface-variant)]">Categorias</p>
                              <p className="font-semibold text-white">
                                {recurringCategoryData.length}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section ref={annualReportRef} className="space-y-4">
                    <div className="glass-surface meta-blue-card rounded-2xl border p-4 md:p-5">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-white">Evolucao Financeira Anual</h3>
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-2 py-1 text-sm">
                          <button
                            type="button"
                            onClick={() => {
                              const currentIndex = reportYearOptions.indexOf(annualReportYear)
                              if (currentIndex < reportYearOptions.length - 1) {
                                setAnnualReportYear(reportYearOptions[currentIndex + 1] ?? annualReportYear)
                              }
                            }}
                            className="rounded-full p-1 transition hover:bg-[var(--m3-surface-container)]"
                            aria-label="Ano anterior"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <span className="min-w-16 text-center font-semibold">{annualReportYear}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const currentIndex = reportYearOptions.indexOf(annualReportYear)
                              if (currentIndex > 0) {
                                setAnnualReportYear(reportYearOptions[currentIndex - 1] ?? annualReportYear)
                              }
                            }}
                            className="rounded-full p-1 transition hover:bg-[var(--m3-surface-container)]"
                            aria-label="Proximo ano"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-[minmax(0,420px)_1fr]">
                        <div className="h-[280px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={annualOverviewData}
                                dataKey="value"
                                nameKey="label"
                                cx="50%"
                                cy="50%"
                                innerRadius={58}
                                outerRadius={105}
                              >
                                {annualOverviewData.map((entry) => (
                                  <Cell key={entry.label} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value) => formatCurrency(Number(value ?? 0))}
                                contentStyle={{
                                  borderRadius: '12px',
                                  borderColor: 'rgba(151,183,255,0.35)',
                                  backgroundColor: 'rgba(10,24,52,0.95)',
                                  color: '#eaf0ff',
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-3">
                          {annualOverviewData.map((item) => (
                            <div key={item.label} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: item.color }}
                                />
                                <span>{item.label}</span>
                              </div>
                              <span className="font-semibold">{formatCurrency(item.value)}</span>
                            </div>
                          ))}
                          <div className="grid gap-2 sm:grid-cols-3">
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-center">
                              <p className="text-xs text-emerald-200">Entradas</p>
                              <p className="font-semibold text-emerald-300">
                                {formatCurrency(annualIncomeTotal)}
                              </p>
                            </div>
                            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-center">
                              <p className="text-xs text-rose-200">Saidas</p>
                              <p className="font-semibold text-rose-300">
                                {formatCurrency(annualExpenseTotal)}
                              </p>
                            </div>
                            <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-2 text-center">
                              <p className="text-xs text-sky-200">Saldo final</p>
                              <p className="font-semibold text-sky-300">
                                {formatCurrency(annualBalanceTotal)}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-[var(--m3-on-surface-variant)]">
                            Media mensal de saldo: {formatCurrency(annualAverageBalance)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="glass-surface meta-blue-card rounded-2xl border p-4 md:p-5">
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <h3 className="text-lg font-semibold text-white">Portfolio de Investimentos</h3>
                        <span className="rounded-full border border-[var(--m3-outline-variant)] px-3 py-1 text-sm text-[var(--m3-on-surface-variant)]">
                          {annualReportYear}
                        </span>
                      </div>
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,420px)_1fr]">
                        <div className="h-[280px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={investmentPortfolioData}
                                dataKey="value"
                                nameKey="label"
                                cx="50%"
                                cy="50%"
                                innerRadius={62}
                                outerRadius={108}
                              >
                                {investmentPortfolioData.map((entry) => (
                                  <Cell key={entry.type} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value) => formatCurrency(Number(value ?? 0))}
                                contentStyle={{
                                  borderRadius: '12px',
                                  borderColor: 'rgba(151,183,255,0.35)',
                                  backgroundColor: 'rgba(10,24,52,0.95)',
                                  color: '#eaf0ff',
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-3">
                          {investmentPortfolioData.length === 0 ? (
                            <p className="text-sm text-[var(--m3-on-surface-variant)]">
                              Nenhum investimento ativo para montar o portfolio.
                            </p>
                          ) : (
                            investmentPortfolioData.map((item) => (
                              <div key={item.type} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />
                                  <span>
                                    {getInvestmentTypeEmoji(item.type)} {item.label}
                                  </span>
                                </div>
                                <span className="font-semibold">{formatCurrency(item.value)}</span>
                              </div>
                            ))
                          )}
                          <div className="grid gap-2 sm:grid-cols-3">
                            <div className="rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] p-2 text-center">
                              <p className="text-xs text-[var(--m3-on-surface-variant)]">
                                Total investido
                              </p>
                              <p className="font-semibold text-[#9db6ff]">
                                {formatCurrency(investmentTotals.totalInvested)}
                              </p>
                            </div>
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-center">
                              <p className="text-xs text-emerald-200">Valor atual</p>
                              <p className="font-semibold text-emerald-300">
                                {formatCurrency(investmentTotals.totalCurrent)}
                              </p>
                            </div>
                            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-2 text-center">
                              <p className="text-xs text-cyan-200">Ativos</p>
                              <p className="font-semibold text-cyan-300">
                                {activeInvestmentsCount}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              ) : null}
              {activeSection === 'premium' ? (
                <p className="text-sm text-[var(--m3-on-surface-variant)]">
                  Página preparada para recursos premium e automações avançadas.
                </p>
              ) : null}

              {activeSection === 'configuracoes' ? (
                <p className="text-sm text-[var(--m3-on-surface-variant)]">
                  Ajuste preferências da conta, notificações e opções do app.
                </p>
              ) : null}
            </CardContent>
          </Card>
        )}

        <Card className="hidden overflow-hidden rounded-[30px] border border-[#3d67c8]/35 bg-[linear-gradient(90deg,var(--pb-nav-from),var(--pb-nav-via),var(--pb-nav-to))] shadow-[0_20px_45px_rgba(4,10,30,0.55)] backdrop-blur-xl lg:block">
          <CardContent className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1 overflow-x-auto">
              <nav className="flex min-w-[980px] gap-2">
                {dashboardSections.map((item) => {
                  const Icon = item.icon
                  const isActive = item.key === activeSection

                  return (
                    <Link
                      key={item.key}
                      to={`/dashboard/${item.key}`}
                      className={cn(
                        'flex min-w-[98px] cursor-pointer flex-col items-center gap-1 rounded-xl border px-3 py-2 text-xs transition duration-200',
                        isActive
                          ? 'border-white/15 bg-[#0a1633]/90 text-white shadow-[0_8px_20px_rgba(0,0,0,0.35)]'
                          : 'border-transparent text-slate-200/85 hover:border-white/10 hover:bg-white/10 hover:text-white',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
            <button
              type="button"
              onClick={onOpenAdd}
              className="shrink-0 cursor-pointer rounded-full px-5 py-2 text-sm font-semibold text-slate-950 shadow-[var(--m3-elevation-2)] transition duration-200 hover:scale-105 hover:brightness-110 hover:shadow-[0_0_0_4px_rgba(52,211,153,0.25)] active:scale-100"
              style={{ backgroundColor: 'var(--pb-accent)' }}
            >
              + Adicionar
            </button>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function AddTransactionModal({
  categories,
  onClose,
  onSubmit,
}: AddTransactionModalProps) {
  const defaultExpenseCategoryKey =
    getCategoriesByType('despesa', categories)[0]?.key ?? ''
  const defaultIncomeCategoryKey =
    getCategoriesByType('receita', categories)[0]?.key ?? ''

  const [formState, setFormState] = useState<TransactionFormState>({
    type: 'despesa',
    date: getTodayDate(),
    value: '',
    categoryKey: defaultExpenseCategoryKey,
    description: '',
    isInstallment: false,
    installmentCount: 1,
    paymentMethod: '',
    cardProvider: '',
  })

  const activeCategories = getCategoriesByType(formState.type, categories)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(formState)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-2xl rounded-[28px] border border-[var(--m3-outline-variant)] bg-[var(--m3-surface)] shadow-[var(--m3-elevation-2)]">
        <div className="flex items-center justify-between border-b border-[var(--m3-outline-variant)] p-5">
          <div>
            <p className="text-sm text-[var(--m3-on-surface-variant)]">
              Novo lancamento
            </p>
            <h2 className="text-lg font-semibold">Adicionar receita ou despesa</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--m3-on-surface-variant)] transition hover:bg-[var(--m3-surface-container)]"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                setFormState((previous) => ({
                  ...previous,
                  type: 'receita',
                  categoryKey: defaultIncomeCategoryKey,
                }))
              }
              className={cn(
                'h-11 rounded-2xl border text-sm font-semibold transition',
                formState.type === 'receita'
                  ? 'border-emerald-500 bg-emerald-600 text-white'
                  : 'border-emerald-500/45 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
              )}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() =>
                setFormState((previous) => ({
                  ...previous,
                  type: 'despesa',
                  categoryKey: defaultExpenseCategoryKey,
                }))
              }
              className={cn(
                'h-11 rounded-2xl border text-sm font-semibold transition',
                formState.type === 'despesa'
                  ? 'border-rose-500 bg-rose-600 text-white'
                  : 'border-rose-500/45 bg-rose-500/10 text-rose-700 dark:text-rose-300',
              )}
            >
              Despesa
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span>{formState.isInstallment ? 'Data da primeira parcela' : 'Data'}</span>
              <input
                type="date"
                value={formState.date}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    date: event.target.value,
                  }))
                }
                className="h-11 w-full rounded-2xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-4"
                required
              />
            </label>

            <label className="space-y-2 text-sm">
              <span>Valor total</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formState.value}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    value: event.target.value,
                  }))
                }
                placeholder="0,00"
                className="h-11 w-full rounded-2xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-4"
                required
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setFormState((previous) => ({
                  ...previous,
                  isInstallment: !previous.isInstallment,
                  installmentCount: !previous.isInstallment
                    ? Math.max(2, previous.installmentCount)
                    : 1,
                }))
              }
              className="inline-flex items-center gap-2 text-sm"
            >
              <span
                className={cn(
                  'inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-emerald-500 transition',
                  formState.isInstallment ? 'bg-emerald-500' : 'bg-transparent',
                )}
              >
                {formState.isInstallment ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                ) : null}
              </span>
              Transacao parcelada
            </button>

            {formState.isInstallment ? (
              <label className="inline-flex items-center gap-2 text-sm">
                <span>Parcelas</span>
                <select
                  value={formState.installmentCount}
                  onChange={(event) =>
                    setFormState((previous) => ({
                      ...previous,
                      installmentCount: Number(event.target.value),
                    }))
                  }
                  className="h-10 rounded-xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-3"
                >
                  {Array.from({ length: 23 }, (_, index) => index + 2).map((count) => (
                    <option key={count} value={count}>
                      {count}x
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span>Forma de pagamento usada (opcional)</span>
              <select
                value={formState.paymentMethod}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    paymentMethod: event.target.value as '' | PaymentMethod,
                    cardProvider:
                      event.target.value === 'cartao' ? previous.cardProvider : '',
                  }))
                }
                className="h-11 w-full rounded-2xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-4"
              >
                <option value="">Nao informar</option>
                <option value="pix">Pix</option>
                <option value="cartao">Cartao</option>
              </select>
            </label>

            {formState.paymentMethod === 'cartao' ? (
              <label className="space-y-2 text-sm">
                <span>Cartão usado</span>
                <select
                  value={formState.cardProvider}
                  onChange={(event) =>
                    setFormState((previous) => ({
                      ...previous,
                      cardProvider: event.target.value as '' | CardProvider,
                    }))
                  }
                  className="h-11 w-full rounded-2xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-4"
                  required
                >
                  <option value="">Selecione um cartão</option>
                  {cardProviderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.emoji} {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-sm">Categoria</p>
            <div className="lg:hidden">
              <select
                value={formState.categoryKey}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    categoryKey: event.target.value,
                  }))
                }
                className="h-11 w-full rounded-2xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-4"
              >
                {activeCategories.map((category) => (
                  <option key={category.key} value={category.key}>
                    {getCategoryOptionLabel(category)}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden gap-2 lg:grid lg:grid-cols-3">
              {activeCategories.map((category) => {
                const active = formState.categoryKey === category.key

                return (
                  <button
                    type="button"
                    key={category.key}
                    onClick={() =>
                      setFormState((previous) => ({
                        ...previous,
                        categoryKey: category.key,
                      }))
                    }
                    className={cn(
                      'flex h-10 items-center gap-2 rounded-xl border px-3 text-left text-sm transition',
                      active
                        ? 'border-[var(--m3-primary)] bg-[var(--m3-secondary-container)] text-[var(--m3-on-secondary-container)]'
                        : 'border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)]',
                    )}
                  >
                    <span className="inline-flex h-4 w-4 items-center justify-center">
                      {getCategoryDisplaySymbol(category)}
                    </span>
                    <span>{category.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <label className="space-y-2 text-sm">
            <span>Descricao (opcional)</span>
            <input
              type="text"
              value={formState.description}
              onChange={(event) =>
                setFormState((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
              placeholder="Ex.: Pagamento de cliente XPTO"
              className="h-11 w-full rounded-2xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-4"
            />
          </label>

          <div className="flex justify-end gap-2 pt-3 sm:pt-5">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Salvar lancamento</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditTransactionModal({
  categories,
  transaction,
  onClose,
  onSubmit,
}: EditTransactionModalProps) {
  const defaultExpenseCategoryKey =
    getCategoriesByType('despesa', categories)[0]?.key ?? ''
  const defaultIncomeCategoryKey =
    getCategoriesByType('receita', categories)[0]?.key ?? ''

  const [formState, setFormState] = useState<
    Omit<TransactionFormState, 'isInstallment' | 'installmentCount'>
  >({
    type: transaction.type,
    date: transaction.date,
    value: String(transaction.value),
    categoryKey: transaction.categoryKey,
    description: transaction.description,
    paymentMethod: transaction.paymentMethod ?? '',
    cardProvider: transaction.cardProvider ?? '',
  })

  const activeCategories = getCategoriesByType(formState.type, categories)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(transaction.id, formState)
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-xl rounded-[28px] border border-[var(--m3-outline-variant)] bg-[var(--m3-surface)] shadow-[var(--m3-elevation-2)]">
        <div className="flex items-center justify-between border-b border-[var(--m3-outline-variant)] p-5">
          <div>
            <p className="text-sm text-[var(--m3-on-surface-variant)]">Editar lancamento</p>
            <h2 className="text-lg font-semibold">Atualize receita ou despesa</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--m3-on-surface-variant)] transition hover:bg-[var(--m3-surface-container)]"
            aria-label="Fechar modal de edicao"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                setFormState((previous) => ({
                  ...previous,
                  type: 'receita',
                  categoryKey: defaultIncomeCategoryKey,
                }))
              }
              className={cn(
                'h-11 rounded-2xl border text-sm font-semibold transition',
                formState.type === 'receita'
                  ? 'border-emerald-500 bg-emerald-600 text-white'
                  : 'border-emerald-500/45 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
              )}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() =>
                setFormState((previous) => ({
                  ...previous,
                  type: 'despesa',
                  categoryKey: defaultExpenseCategoryKey,
                }))
              }
              className={cn(
                'h-11 rounded-2xl border text-sm font-semibold transition',
                formState.type === 'despesa'
                  ? 'border-rose-500 bg-rose-600 text-white'
                  : 'border-rose-500/45 bg-rose-500/10 text-rose-700 dark:text-rose-300',
              )}
            >
              Despesa
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span>Data</span>
              <input
                type="date"
                value={formState.date}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, date: event.target.value }))
                }
                className="h-11 w-full rounded-2xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-4"
                required
              />
            </label>

            <label className="space-y-2 text-sm">
              <span>Valor</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formState.value}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, value: event.target.value }))
                }
                className="h-11 w-full rounded-2xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-4"
                required
              />
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span>Categoria</span>
            <select
              value={formState.categoryKey}
              onChange={(event) =>
                setFormState((previous) => ({ ...previous, categoryKey: event.target.value }))
              }
              className="h-11 w-full rounded-2xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-4"
            >
              {activeCategories.map((category) => (
                <option key={category.key} value={category.key}>
                  {getCategoryOptionLabel(category)}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span>Forma de pagamento usada (opcional)</span>
              <select
                value={formState.paymentMethod}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    paymentMethod: event.target.value as '' | PaymentMethod,
                    cardProvider:
                      event.target.value === 'cartao' ? previous.cardProvider : '',
                  }))
                }
                className="h-11 w-full rounded-2xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-4"
              >
                <option value="">Nao informar</option>
                <option value="pix">Pix</option>
                <option value="cartao">Cartao</option>
              </select>
            </label>

            {formState.paymentMethod === 'cartao' ? (
              <label className="space-y-2 text-sm">
                <span>Cartão usado</span>
                <select
                  value={formState.cardProvider}
                  onChange={(event) =>
                    setFormState((previous) => ({
                      ...previous,
                      cardProvider: event.target.value as '' | CardProvider,
                    }))
                  }
                  className="h-11 w-full rounded-2xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-4"
                  required
                >
                  <option value="">Selecione um cartão</option>
                  {cardProviderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.emoji} {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          <label className="space-y-2 text-sm">
            <span>Descricao (opcional)</span>
            <input
              type="text"
              value={formState.description}
              onChange={(event) =>
                setFormState((previous) => ({ ...previous, description: event.target.value }))
              }
              className="h-11 w-full rounded-2xl border border-[var(--m3-outline-variant)] bg-[var(--m3-surface-container-low)] px-4"
            />
          </label>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Salvar alteracoes</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  const { isLoaded: isAuthLoaded, isSignedIn, getToken } = useAuth()
  const { user } = useUser()
  const location = useLocation()
  const [appUserId, setAppUserId] = useState<string | null>(null)
  const [customCategories, setCustomCategories] = useState<CategoryDef[]>(() =>
    readStoredCustomCategories(),
  )
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(() => readStoredThemes())
  const [activeThemeId, setActiveThemeId] = useState(() => getInitialActiveThemeId())
  const [goals, setGoals] = useState<FinancialGoal[]>(() => readStoredGoals())
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    readStoredTransactions(),
  )
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getInitialThemeMode())
  const allCategories = useMemo(
    () => getMergedCategories(customCategories),
    [customCategories],
  )
  const themePresets = useMemo(
    () => [defaultThemePreset, ...customThemes],
    [customThemes],
  )
  const activeTheme = useMemo(
    () =>
      themePresets.find((theme) => theme.id === activeThemeId) ?? defaultThemePreset,
    [themePresets, activeThemeId],
  )

  useEffect(() => {
    window.localStorage.setItem(transactionsStorageKey, JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    window.localStorage.setItem(
      customCategoriesStorageKey,
      JSON.stringify(customCategories),
    )
  }, [customCategories])

  useEffect(() => {
    window.localStorage.setItem(customThemesStorageKey, JSON.stringify(customThemes))
  }, [customThemes])

  useEffect(() => {
    window.localStorage.setItem(goalsStorageKey, JSON.stringify(goals))
  }, [goals])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark')
    window.localStorage.setItem(themeStorageKey, themeMode)
  }, [themeMode])

  useEffect(() => {
    if (!themePresets.some((theme) => theme.id === activeThemeId)) {
      setActiveThemeId(defaultThemePreset.id)
    }
  }, [themePresets, activeThemeId])

  useEffect(() => {
    window.localStorage.setItem(activeThemeStorageKey, activeThemeId)
  }, [activeThemeId])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--pb-primary', activeTheme.primaryColor)
    root.style.setProperty('--pb-accent', activeTheme.accentColor)
    root.style.setProperty('--pb-nav-from', activeTheme.navFrom)
    root.style.setProperty('--pb-nav-via', activeTheme.navVia)
    root.style.setProperty('--pb-nav-to', activeTheme.navTo)
    root.style.setProperty('--m3-primary', activeTheme.primaryColor)
  }, [activeTheme])

  useEffect(() => {
    setIsMobileNavOpen(false)
  }, [location.pathname])

  const getDbContext = useCallback(async (): Promise<DbContext | null> => {
    if (!isAuthLoaded || !isSignedIn || !user?.id) {
      return null
    }

    const tokenFromTemplate = await getToken({ template: 'supabase' }).catch(
      () => null,
    )
    const clerkToken = tokenFromTemplate ?? (await getToken().catch(() => null))
    if (!clerkToken) {
      return null
    }

    const db = createSupabaseClientWithClerkToken(clerkToken)
    let resolvedAppUserId = appUserId

    if (!resolvedAppUserId) {
      const { data, error } = await db
        .from('app_users')
        .upsert(
          {
            clerk_user_id: user.id,
            email: user.primaryEmailAddress?.emailAddress ?? null,
            full_name: user.fullName ?? user.username ?? null,
          },
          { onConflict: 'clerk_user_id' },
        )
        .select('id')
        .single()

      if (error || !data?.id) {
        console.error('Falha ao garantir app_users:', error)
        return null
      }

      resolvedAppUserId = data.id as string
      setAppUserId(resolvedAppUserId)
    }

    return { db, appUserId: resolvedAppUserId }
  }, [isAuthLoaded, isSignedIn, user?.id, user?.fullName, user?.username, user?.primaryEmailAddress?.emailAddress, getToken, appUserId])

  useEffect(() => {
    if (!isAuthLoaded) {
      return
    }

    if (!isSignedIn || !user?.id) {
      setAppUserId(null)
      return
    }

    let isCancelled = false

    const syncFromDatabase = async () => {
      const context = await getDbContext()
      if (!context || isCancelled) {
        return
      }

      const [
        { data: dbTransactions, error: txError },
        { data: dbGoals, error: goalError },
        { data: dbUserCategories, error: categoriesError },
        { data: dbUserThemes, error: themesError },
      ] = await Promise.all([
        context.db
          .from('transactions')
          .select('*')
          .order('entry_date', { ascending: false })
          .order('created_at', { ascending: false }),
        context.db
          .from('financial_goals')
          .select('*')
          .order('created_at', { ascending: false }),
        context.db
          .from('user_categories')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        context.db
          .from('user_themes')
          .select('*')
          .order('created_at', { ascending: false }),
      ])

      if (!txError && dbTransactions && !isCancelled) {
        setTransactions((dbTransactions as DbTransactionRow[]).map(mapDbTransactionRow))
      }

      if (!goalError && dbGoals && !isCancelled) {
        setGoals((dbGoals as DbGoalRow[]).map(mapDbGoalRow))
      }

      if (!categoriesError && dbUserCategories && !isCancelled) {
        setCustomCategories(
          (dbUserCategories as DbUserCategoryRow[]).map(mapDbUserCategoryRow),
        )
      }

      if (!themesError && dbUserThemes && !isCancelled) {
        const rows = dbUserThemes as DbUserThemeRow[]
        setCustomThemes(rows.map(mapDbUserThemeRow))
        const activeDbTheme = rows.find((theme) => theme.is_active)
        setActiveThemeId(activeDbTheme?.id ?? defaultThemePreset.id)
      }
    }

    void syncFromDatabase()

    return () => {
      isCancelled = true
    }
  }, [isAuthLoaded, isSignedIn, user?.id, getDbContext])

  const handleCreateTransaction = async (form: TransactionFormState) => {
    const parsedValue = Number(form.value.replace(',', '.'))
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      return
    }

    const category = getCategoryByKey(form.categoryKey, allCategories)
    if (!category) {
      return
    }

    const paymentMethod = parsePaymentMethod(form.paymentMethod)
    const cardProvider =
      paymentMethod === 'cartao' ? parseCardProvider(form.cardProvider) : null

    if (paymentMethod === 'cartao' && !cardProvider) {
      return
    }

    const installmentCount = form.isInstallment
      ? Math.max(2, form.installmentCount)
      : 1

    const installmentValues = splitAmountInInstallments(
      parsedValue,
      installmentCount,
    )
    const baseDate = new Date(`${form.date}T12:00:00`)
    const groupId = generateId()

    const generatedTransactions = installmentValues.map((installmentValue, index) => {
      const installmentDate = addMonths(baseDate, index)

      return {
        id: generateId(),
        groupId,
        type: form.type,
        date: toIsoDate(installmentDate),
        value: installmentValue,
        categoryKey: category.key,
        categoryLabel: category.label,
        description: form.description.trim(),
        installmentNumber: index + 1,
        installmentCount,
        firstInstallmentDate: form.date,
        paymentMethod,
        cardProvider,
        createdAt: new Date().toISOString(),
      } satisfies Transaction
    })

    const context = await getDbContext()

    if (context) {
      const { error } = await context.db
        .from('transactions')
        .insert(toDbTransactionRows(generatedTransactions, context.appUserId))

      if (!error) {
        const { data: dbTransactions, error: fetchError } = await context.db
          .from('transactions')
          .select('*')
          .order('entry_date', { ascending: false })
          .order('created_at', { ascending: false })

        if (!fetchError && dbTransactions) {
          setTransactions((dbTransactions as DbTransactionRow[]).map(mapDbTransactionRow))
          setIsAddModalOpen(false)
          return
        }
      } else {
        console.error('Falha ao salvar transação no Supabase:', error)
      }
    }

    // Fallback local quando não houver sessão no Supabase.
    setTransactions((previous) => [...generatedTransactions, ...previous])
    setIsAddModalOpen(false)
  }

  const handleUpdateTransaction = async (
    id: string,
    form: Omit<TransactionFormState, 'isInstallment' | 'installmentCount'>,
  ) => {
    const parsedValue = Number(form.value.replace(',', '.'))
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      return
    }

    const category = getCategoryByKey(form.categoryKey, allCategories)
    if (!category || category.type !== form.type) {
      return
    }

    const paymentMethod = parsePaymentMethod(form.paymentMethod)
    const cardProvider =
      paymentMethod === 'cartao' ? parseCardProvider(form.cardProvider) : null

    if (paymentMethod === 'cartao' && !cardProvider) {
      return
    }

    const context = await getDbContext()
    if (context) {
      const { error } = await context.db
        .from('transactions')
        .update({
          type: form.type,
          entry_date: form.date,
          amount: parsedValue,
          category_key: category.key,
          category_label: category.label,
          description: form.description.trim() || null,
          payment_method: paymentMethod,
          card_provider: cardProvider,
        })
        .eq('id', id)

      if (!error) {
        const { data: dbTransactions, error: fetchError } = await context.db
          .from('transactions')
          .select('*')
          .order('entry_date', { ascending: false })
          .order('created_at', { ascending: false })
        if (!fetchError && dbTransactions) {
          setTransactions((dbTransactions as DbTransactionRow[]).map(mapDbTransactionRow))
          setEditingTransaction(null)
          return
        }
      } else {
        console.error('Falha ao atualizar transação no Supabase:', error)
      }
    }

    setTransactions((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              type: form.type,
              date: form.date,
              value: parsedValue,
              categoryKey: category.key,
              categoryLabel: category.label,
              description: form.description.trim(),
              paymentMethod,
              cardProvider,
            }
          : item,
      ),
    )

    setEditingTransaction(null)
  }

  const handleDeleteTransaction = async (id: string) => {
    const context = await getDbContext()
    if (context) {
      const { error } = await context.db.from('transactions').delete().eq('id', id)
      if (!error) {
        setTransactions((previous) => previous.filter((item) => item.id !== id))
        if (editingTransaction?.id === id) {
          setEditingTransaction(null)
        }
        return
      }
      console.error('Falha ao excluir transação no Supabase:', error)
    }

    setTransactions((previous) => previous.filter((item) => item.id !== id))
    if (editingTransaction?.id === id) {
      setEditingTransaction(null)
    }
  }

  const handleCreateCategory = async (input: {
    type: TransactionType
    emoji: string
    label: string
    iconKey?: string
  }) => {
    const label = input.label.trim()
    const emoji = input.emoji.trim()
    if (!label || !emoji) {
      return
    }

    const context = await getDbContext()
    if (context) {
      const { error } = await context.db.from('user_categories').insert({
        user_id: context.appUserId,
        type: input.type,
        label,
        emoji,
        icon_key: null,
        is_active: true,
      })

      if (!error) {
        const { data: categoryRows, error: fetchError } = await context.db
          .from('user_categories')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
        if (!fetchError && categoryRows) {
          setCustomCategories(
            (categoryRows as DbUserCategoryRow[]).map(mapDbUserCategoryRow),
          )
          return
        }
      } else {
        console.error('Falha ao criar categoria no Supabase:', error)
      }
    }

    setCustomCategories((previous) => {
      const exists = getMergedCategories(previous).some(
        (category) =>
          category.type === input.type &&
          category.label.toLowerCase() === label.toLowerCase(),
      )
      if (exists) {
        return previous
      }

      const key = `custom-${input.type}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`

      return [
        ...previous,
        {
          key,
          type: input.type,
          label,
          emoji,
        },
      ]
    })
  }

  const handleCreateTheme = async (input: Omit<CustomTheme, 'id' | 'createdAt'>) => {
    const name = input.name.trim()
    if (
      !name ||
      !isHexColor(input.primaryColor) ||
      !isHexColor(input.accentColor) ||
      !isHexColor(input.navFrom) ||
      !isHexColor(input.navVia) ||
      !isHexColor(input.navTo)
    ) {
      return
    }

    const context = await getDbContext()
    if (context) {
      const { error } = await context.db.from('user_themes').insert({
        user_id: context.appUserId,
        name,
        primary_color: input.primaryColor,
        accent_color: input.accentColor,
        nav_from: input.navFrom,
        nav_via: input.navVia,
        nav_to: input.navTo,
        is_active: false,
      })

      if (!error) {
        const { data: themeRows, error: fetchError } = await context.db
          .from('user_themes')
          .select('*')
          .order('created_at', { ascending: false })
        if (!fetchError && themeRows) {
          setCustomThemes((themeRows as DbUserThemeRow[]).map(mapDbUserThemeRow))
          return
        }
      } else {
        console.error('Falha ao criar tema no Supabase:', error)
      }
    }

    setCustomThemes((previous) => {
      const exists = previous.some(
        (theme) => theme.name.toLowerCase() === name.toLowerCase(),
      )
      if (exists) {
        return previous
      }
      const createdTheme: CustomTheme = {
        id: `theme-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name,
        primaryColor: input.primaryColor,
        accentColor: input.accentColor,
        navFrom: input.navFrom,
        navVia: input.navVia,
        navTo: input.navTo,
        createdAt: new Date().toISOString(),
      }
      return [createdTheme, ...previous]
    })
  }

  const handleApplyTheme = async (themeId: string) => {
    const nextThemeId = themePresets.some((theme) => theme.id === themeId)
      ? themeId
      : defaultThemePreset.id

    setActiveThemeId(nextThemeId)

    const context = await getDbContext()
    if (!context) {
      return
    }

    const { error: clearError } = await context.db
      .from('user_themes')
      .update({ is_active: false })
      .eq('user_id', context.appUserId)
      .eq('is_active', true)

    if (clearError) {
      console.error('Falha ao limpar tema ativo no Supabase:', clearError)
      return
    }

    if (nextThemeId === defaultThemePreset.id) {
      return
    }

    const { error: activateError } = await context.db
      .from('user_themes')
      .update({ is_active: true })
      .eq('id', nextThemeId)
    if (activateError) {
      console.error('Falha ao ativar tema no Supabase:', activateError)
    }
  }

  const handleDeleteTheme = async (themeId: string) => {
    if (themeId === defaultThemePreset.id) {
      return
    }

    const context = await getDbContext()
    if (context) {
      const { error } = await context.db
        .from('user_themes')
        .delete()
        .eq('id', themeId)
      if (error) {
        console.error('Falha ao remover tema no Supabase:', error)
      }
    }

    setCustomThemes((previous) => previous.filter((theme) => theme.id !== themeId))
    if (activeThemeId === themeId) {
      void handleApplyTheme(defaultThemePreset.id)
    }
  }

  const handleCreateGoal = async (input: {
    name: string
    targetAmount: number
    targetDate: string
  }) => {
    const name = input.name.trim()
    if (!name || input.targetAmount <= 0 || !input.targetDate) {
      return
    }

    const context = await getDbContext()
    if (context) {
      const { error } = await context.db.from('financial_goals').insert({
        user_id: context.appUserId,
        name,
        target_amount: input.targetAmount,
        current_amount: 0,
        target_date: input.targetDate,
      })

      if (!error) {
        const { data: dbGoals, error: fetchError } = await context.db
          .from('financial_goals')
          .select('*')
          .order('created_at', { ascending: false })
        if (!fetchError && dbGoals) {
          setGoals((dbGoals as DbGoalRow[]).map(mapDbGoalRow))
          return
        }
      } else {
        console.error('Falha ao criar meta no Supabase:', error)
      }
    }

    setGoals((previous) => [
      {
        id: generateId(),
        name,
        targetAmount: input.targetAmount,
        currentAmount: 0,
        targetDate: input.targetDate,
        createdAt: new Date().toISOString(),
      },
      ...previous,
    ])
  }

  const handleUpdateGoal = async (goal: FinancialGoal) => {
    const context = await getDbContext()
    if (context) {
      const { error } = await context.db
        .from('financial_goals')
        .update({
          name: goal.name,
          target_amount: goal.targetAmount,
          current_amount: goal.currentAmount,
          target_date: goal.targetDate,
        })
        .eq('id', goal.id)

      if (!error) {
        const { data: dbGoals, error: fetchError } = await context.db
          .from('financial_goals')
          .select('*')
          .order('created_at', { ascending: false })
        if (!fetchError && dbGoals) {
          setGoals((dbGoals as DbGoalRow[]).map(mapDbGoalRow))
          return
        }
      } else {
        console.error('Falha ao atualizar meta no Supabase:', error)
      }
    }

    setGoals((previous) =>
      previous.map((item) => (item.id === goal.id ? goal : item)),
    )
  }

  const handleDeleteGoal = async (goalId: string) => {
    const context = await getDbContext()
    if (context) {
      const { error } = await context.db
        .from('financial_goals')
        .delete()
        .eq('id', goalId)
      if (!error) {
        setGoals((previous) => previous.filter((goal) => goal.id !== goalId))
        return
      }
      console.error('Falha ao remover meta no Supabase:', error)
    }

    setGoals((previous) => previous.filter((goal) => goal.id !== goalId))
  }

  const handleAddGoalAmount = async (goalId: string, amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) {
      return
    }

    const nextGoal = goals.find((goal) => goal.id === goalId)
    if (!nextGoal) {
      return
    }

    const updatedCurrentAmount = nextGoal.currentAmount + amount
    const context = await getDbContext()
    if (context) {
      const { error } = await context.db
        .from('financial_goals')
        .update({ current_amount: updatedCurrentAmount })
        .eq('id', goalId)

      if (!error) {
        setGoals((previous) =>
          previous.map((goal) =>
            goal.id === goalId
              ? { ...goal, currentAmount: updatedCurrentAmount }
              : goal,
          ),
        )
        return
      }
      console.error('Falha ao adicionar valor na meta no Supabase:', error)
    }

    setGoals((previous) =>
      previous.map((goal) =>
        goal.id === goalId
          ? { ...goal, currentAmount: goal.currentAmount + amount }
          : goal,
      ),
    )
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard/resumo" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/:section"
          element={
            <ProtectedRoute>
              <DashboardPage
                transactions={transactions}
                categories={allCategories}
                goals={goals}
                onOpenAdd={() => setIsAddModalOpen(true)}
                onEditTransaction={(transaction) => setEditingTransaction(transaction)}
                onDeleteTransaction={handleDeleteTransaction}
                onCreateCategory={handleCreateCategory}
                onCreateGoal={handleCreateGoal}
                onUpdateGoal={handleUpdateGoal}
                onDeleteGoal={handleDeleteGoal}
                onAddGoalAmount={handleAddGoalAmount}
                themeMode={themeMode}
                onToggleThemeMode={() =>
                  setThemeMode((previous) => (previous === 'dark' ? 'light' : 'dark'))
                }
                themePresets={themePresets}
                activeThemeId={activeThemeId}
                onCreateTheme={handleCreateTheme}
                onApplyTheme={handleApplyTheme}
                onDeleteTheme={handleDeleteTheme}
                getDbContext={getDbContext}
              />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Show when="signed-in">
        <button
          type="button"
          onClick={() => setIsMobileNavOpen((previous) => !previous)}
          className="fixed bottom-6 right-6 z-[90] inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#3d67c8]/40 bg-[linear-gradient(90deg,var(--pb-nav-from),var(--pb-nav-via),var(--pb-nav-to))] text-white shadow-[0_14px_28px_rgba(4,10,30,0.55)] backdrop-blur-xl transition hover:brightness-110 lg:hidden"
          aria-expanded={isMobileNavOpen}
          aria-label="Abrir atalhos"
        >
          <Plus className="h-5 w-5" />
        </button>

        {isMobileNavOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[86] bg-black/45 lg:hidden"
              onClick={() => setIsMobileNavOpen(false)}
              aria-label="Fechar atalhos"
            />
            <div className="fixed bottom-20 right-4 z-[87] w-[min(360px,calc(100vw-2rem))] rounded-3xl border border-[#3d67c8]/35 bg-[linear-gradient(90deg,var(--pb-nav-from),var(--pb-nav-via),var(--pb-nav-to))] p-4 text-slate-100 shadow-[0_24px_45px_rgba(4,10,30,0.58)] backdrop-blur-xl lg:hidden">
              <Button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(true)
                  setIsMobileNavOpen(false)
                }}
                className="mb-3 w-full justify-center text-slate-950 hover:brightness-110"
                style={{ backgroundColor: 'var(--pb-accent)' }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo lancamento
              </Button>
              <div className="grid grid-cols-2 gap-2">
                {dashboardSections.map((item) => {
                  const Icon = item.icon
                  const href = `/dashboard/${item.key}`
                  const isActive = location.pathname === href

                  return (
                    <Link
                      key={item.key}
                      to={href}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition',
                        isActive
                          ? 'border-white/15 bg-[#0a1633]/90 text-white shadow-[0_8px_20px_rgba(0,0,0,0.35)]'
                          : 'border-white/10 bg-white/10 text-slate-100 hover:border-white/20 hover:bg-white/15',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </>
        ) : null}
      </Show>

      <button
        type="button"
        onClick={() =>
          setThemeMode((previous) => (previous === 'dark' ? 'light' : 'dark'))
        }
        className="fixed bottom-6 left-6 z-[90] inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--m3-outline-variant)] bg-[var(--m3-surface)] text-[var(--m3-on-surface)] shadow-[var(--m3-elevation-1)] transition hover:bg-[var(--m3-surface-container)]"
        aria-label="Alternar tema"
      >
        {themeMode === 'dark' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>

      {isAddModalOpen ? (
        <AddTransactionModal
          categories={allCategories}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleCreateTransaction}
        />
      ) : null}

      {editingTransaction ? (
        <EditTransactionModal
          categories={allCategories}
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSubmit={handleUpdateTransaction}
        />
      ) : null}
    </>
  )
}


