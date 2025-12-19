import { User, CompanyProfile, JobDatabase } from '../types';
import { INITIAL_USERS, INITIAL_COMPANIES } from '../constants';
import { JOB_SUGGESTIONS as INITIAL_JOB_DB } from '../data/riasecContent';

// UPDATED KEYS TO V7 TO FIX VISUALIZATION ISSUES
const KEYS = {
  USERS: 'jnana_db_users_v7',
  COMPANIES: 'jnana_db_companies_v7',
  JOB_DB: 'jnana_db_jobs_v7'
};

/**
 * Loads Users from LocalStorage. 
 * If not found, returns the INITIAL_USERS mock data.
 */
export const loadUsers = (): User[] => {
  try {
    const stored = localStorage.getItem(KEYS.USERS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading users from DB", e);
  }
  return INITIAL_USERS;
};

/**
 * Loads Companies from LocalStorage.
 * If not found, returns the INITIAL_COMPANIES mock data.
 */
export const loadCompanies = (): CompanyProfile[] => {
  try {
    const stored = localStorage.getItem(KEYS.COMPANIES);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading companies from DB", e);
  }
  return INITIAL_COMPANIES;
};

/**
 * Loads Job Database from LocalStorage.
 * If not found, returns the INITIAL_JOB_SUGGESTIONS mock data.
 */
export const loadJobDb = (): JobDatabase => {
  try {
    const stored = localStorage.getItem(KEYS.JOB_DB);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading job db from DB", e);
  }
  return INITIAL_JOB_DB;
};

// --- SAVERS ---

export const saveUsers = (users: User[]) => {
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

export const saveCompanies = (companies: CompanyProfile[]) => {
  localStorage.setItem(KEYS.COMPANIES, JSON.stringify(companies));
};

export const saveJobDb = (jobDb: JobDatabase) => {
  localStorage.setItem(KEYS.JOB_DB, JSON.stringify(jobDb));
};

/**
 * Nuke everything and reload the page to restore initial state.
 */
export const resetDatabase = () => {
  localStorage.removeItem(KEYS.USERS);
  localStorage.removeItem(KEYS.COMPANIES);
  localStorage.removeItem(KEYS.JOB_DB);
  window.location.reload();
};