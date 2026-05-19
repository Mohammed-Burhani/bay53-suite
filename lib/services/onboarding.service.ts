import { supabase } from './supabase';
import { createClient } from '@/supabase/client';

export interface Organization {
  id: string;
  company_name: string;
  country: string;
  address: string;
  email: string;
  phone_number: string;
  contact_person: string;
  gst_number: string;
  state: string;
  pin_code: string;
  currency: string;
  nature_of_business: 'Retail' | 'Wholesale' | 'Distribution' | 'Trading' | 'Manufacturing' | 'Fabrication';
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  organization_id: string;
  username: string;
  email: string;
  password_hash?: string;
  google_id?: string;
  google_picture_url?: string;
  auth_provider: 'email' | 'google';
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface OnboardingStatus {
  id: string;
  user_id: string;
  organization_id: string;
  company_info_completed: boolean;
  location_tax_completed: boolean;
  admin_account_completed: boolean;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanySetupInput {
  companyName: string;
  country: string;
  address: string;
  email: string;
  phoneNumber: string;
  contactPerson: string;
  gstNumber: string;
  state: string;
  pinCode: string;
  currency: string;
  natureOfBusiness: 'Retail' | 'Wholesale' | 'Distribution' | 'Trading' | 'Manufacturing' | 'Fabrication';
  logo?: File | null;
}

export interface GoogleUserInput {
  email: string;
  name: string;
  googleId: string;
  picture?: string;
}

class OnboardingService {
  // =====================================================
  // COMPANY SETUP (Manual Signup)
  // =====================================================

  async setupCompany(input: CompanySetupInput): Promise<{ user: User; organization: Organization }> {
    // Get current Google auth user (must be logged in via Google OAuth)
    const supabaseClient = createClient();
    const { data: { user: authUser }, error: authCheckError } = await supabaseClient.auth.getUser();
    
    if (authCheckError || !authUser) {
      throw new Error('Must be logged in with Google to complete setup');
    }

    // 1. Upload logo if provided
    let logoUrl: string | undefined;
    if (input.logo) {
      logoUrl = await this.uploadLogo(input.logo);
    }

    // 2. Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        company_name: input.companyName,
        country: input.country,
        address: input.address,
        email: input.email,
        phone_number: input.phoneNumber,
        contact_person: input.contactPerson,
        gst_number: input.gstNumber,
        state: input.state,
        pin_code: input.pinCode,
        currency: input.currency,
        nature_of_business: input.natureOfBusiness,
        logo_url: logoUrl,
      })
      .select()
      .single();

    if (orgError) throw orgError;

    try {
      // 3. Update user with organization_id
      const { data: user, error: userError } = await supabase
        .from('users')
        .update({ organization_id: org.id, is_admin: true })
        .eq('id', authUser.id)
        .select()
        .single();

      if (userError) throw userError;

      // 4. Create subscription (14-day trial)
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      const { error: subError } = await supabase
        .from('organization_subscriptions')
        .insert({
          organization_id: org.id,
          status: 'trial',
          trial_start_date: new Date().toISOString(),
          trial_end_date: trialEndDate.toISOString(),
        });

      if (subError) throw subError;

      // 5. Create onboarding status
      const { error: onboardingError } = await supabase
        .from('onboarding_status')
        .insert({
          user_id: authUser.id,
          organization_id: org.id,
          company_info_completed: true,
          location_tax_completed: true,
          admin_account_completed: true,
          is_completed: true,
          completed_at: new Date().toISOString(),
        });

      if (onboardingError) throw onboardingError;

      return { user, organization: org };
    } catch (err) {
      // Rollback: delete organization if user/subscription creation failed
      await supabase.from('organizations').delete().eq('id', org.id);
      throw err;
    }
  }

  // =====================================================
  // GOOGLE OAUTH SIGNUP
  // =====================================================

  async handleGoogleUser(input: GoogleUserInput): Promise<{ 
    user: User; 
    organization: Organization | null; 
    isNewUser: boolean 
  }> {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*, organizations(*)')
      .eq('google_id', input.googleId)
      .single();

    if (existingUser) {
      // Update last login
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', existingUser.id);

      return {
        user: existingUser,
        organization: existingUser.organizations,
        isNewUser: false,
      };
    }

    // New user - create record (no org yet, will be set in setupCompany)
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        id: input.googleId, // Use Google ID as user ID
        email: input.email,
        google_id: input.googleId,
        google_picture_url: input.picture,
        auth_provider: 'google',
        first_name: input.name.split(' ')[0],
        last_name: input.name.split(' ').slice(1).join(' ') || null,
        role: 'admin',
        is_admin: false, // Will be set to true in setupCompany
        organization_id: null, // Will be set in setupCompany
      })
      .select()
      .single();

    if (userError) throw userError;

    return {
      user: newUser,
      organization: null,
      isNewUser: true,
    };
  }

  // =====================================================
  // COMPLETE GOOGLE USER SETUP
  // =====================================================

  async completeGoogleUserSetup(
    userId: string,
    input: Omit<CompanySetupInput, never> // No fields to omit now
  ): Promise<{ user: User; organization: Organization }> {
    // Same as setupCompany but for Google users who already have user record
    return this.setupCompany(input);
  }

  // =====================================================
  // LOGO UPLOAD
  // =====================================================

  private async uploadLogo(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('company-assets')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('company-assets')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  // =====================================================
  // QUERIES
  // =====================================================

  async getOrganization(id: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getUser(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getOnboardingStatus(userId: string): Promise<OnboardingStatus | null> {
    const { data, error } = await supabase
      .from('onboarding_status')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateOnboardingStep(
    userId: string,
    step: 'company_info' | 'location_tax' | 'admin_account',
    completed: boolean
  ): Promise<void> {
    const fieldMap = {
      company_info: 'company_info_completed',
      location_tax: 'location_tax_completed',
      admin_account: 'admin_account_completed',
    };

    const { error } = await supabase
      .from('onboarding_status')
      .update({ [fieldMap[step]]: completed })
      .eq('user_id', userId);

    if (error) throw error;

    // Check if all steps completed
    const { data: status } = await supabase
      .from('onboarding_status')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (
      status &&
      status.company_info_completed &&
      status.location_tax_completed &&
      status.admin_account_completed &&
      !status.is_completed
    ) {
      await supabase
        .from('onboarding_status')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }
  }
}

export const onboardingService = new OnboardingService();
