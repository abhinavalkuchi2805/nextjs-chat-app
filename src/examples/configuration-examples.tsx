/**
 * Example: How to use different configurations in your page
 * 
 * This file demonstrates various ways to configure the ChatUI component
 * for different use cases.
 */

import ChatUI from '@/components/ChatUI';
import { 
  chatUIConfig,
  minimalConfig, 
  fullFeaturedConfig, 
  simpleQAConfig 
} from '@/config/chatUIConfig';

// ============================================
// Example 1: Default Configuration
// ============================================
export function DefaultChatPage() {
  // Uses the default configuration from chatUIConfig.ts
  return <ChatUI />;
}

// ============================================
// Example 2: Minimal Chat (Embedded Widget)
// ============================================
export function MinimalChatWidget() {
  // Perfect for embedding in other applications
  return <ChatUI config={minimalConfig} />;
}

// ============================================
// Example 3: Simple Q&A Interface
// ============================================
export function SimpleQAPage() {
  // Good for documentation or help centers
  return <ChatUI config={simpleQAConfig} />;
}

// ============================================
// Example 4: Full-Featured Interface
// ============================================
export function FullFeaturedChatPage() {
  // All features enabled
  return <ChatUI config={fullFeaturedConfig} />;
}

// ============================================
// Example 5: Custom Configuration
// ============================================
export function CustomChatPage() {
  // Override specific features only
  return (
    <ChatUI 
      config={{
        components: {
          header: true,
          sidebar: false,        // Hide sidebar
          fileUpload: false,     // Hide file upload
          modelSelector: true,   // Keep model selector
        },
        messages: {
          avatars: true,
          timestamps: false,     // Hide timestamps
        },
      }}
    />
  );
}

// ============================================
// Example 6: Read-Only Chat (No Input Options)
// ============================================
export function ReadOnlyChatPage() {
  return (
    <ChatUI 
      config={{
        components: {
          header: true,
          sidebar: true,
          uploadStatus: false,
          loadingBar: true,
          suggestedQueries: false,
          modelSelector: false,
          fileUpload: false,
          typingIndicator: true,
        },
        features: {
          conversationHistory: true,
          newConversation: false,    // Can't create new chats
          deleteConversation: false, // Can't delete chats
          stats: true,
        },
      }}
    />
  );
}

// ============================================
// Example 7: Anonymous Chat (No History)
// ============================================
export function AnonymousChatPage() {
  return (
    <ChatUI 
      config={{
        components: {
          header: false,
          sidebar: false,
        },
        messages: {
          avatars: false,
          timestamps: false,
          welcomeMessage: false,
        },
        features: {
          conversationHistory: false,
          newConversation: false,
          deleteConversation: false,
          stats: false,
        },
      }}
    />
  );
}

// ============================================
// Example 8: Admin Dashboard Chat
// ============================================
export function AdminChatPage() {
  // Full features with all controls
  return (
    <ChatUI 
      config={{
        components: {
          header: true,
          sidebar: true,
          uploadStatus: true,
          loadingBar: true,
          suggestedQueries: true,
          modelSelector: true,
          fileUpload: true,
          typingIndicator: true,
        },
        messages: {
          avatars: true,
          timestamps: true,
          markdown: true,
          welcomeMessage: true,
        },
        features: {
          conversationHistory: true,
          newConversation: true,
          deleteConversation: true,
          stats: true,
        },
        theme: {
          themeSwitcher: true,
        },
      }}
    />
  );
}

// ============================================
// Example 9: Mobile-Optimized Chat
// ============================================
export function MobileChatPage() {
  return (
    <ChatUI 
      config={{
        components: {
          header: true,
          sidebar: false,          // Hide sidebar on mobile
          uploadStatus: true,
          loadingBar: true,
          suggestedQueries: true,
          modelSelector: false,    // Hide model selector on mobile
          fileUpload: true,
          typingIndicator: true,
        },
        messages: {
          avatars: true,
          timestamps: false,       // Save space on mobile
          markdown: true,
          welcomeMessage: true,
        },
      }}
    />
  );
}

// ============================================
// Example 10: Dynamic Configuration Based on User Role
// ============================================
export function RoleBasedChatPage({ userRole }: { userRole: 'admin' | 'user' | 'guest' }) {
  // Different config based on user permissions
  const configByRole = {
    admin: fullFeaturedConfig,
    user: simpleQAConfig,
    guest: minimalConfig,
  };

  return <ChatUI config={configByRole[userRole]} />;
}

// ============================================
// Example 11: Environment-Based Configuration
// ============================================
export function EnvironmentBasedChatPage() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return (
    <ChatUI 
      config={{
        components: {
          header: true,
          sidebar: isDevelopment,      // Show sidebar only in dev
          modelSelector: isDevelopment, // Show model selector only in dev
        },
        features: {
          stats: isDevelopment,        // Show stats only in dev
        },
      }}
    />
  );
}

// ============================================
// Example 12: Feature Flag Based Configuration
// ============================================
export function FeatureFlagChatPage() {
  // Example: using feature flags from a configuration service
  const featureFlags = {
    fileUpload: true,
    conversationHistory: true,
    modelSelector: false,
  };

  return (
    <ChatUI 
      config={{
        components: {
          fileUpload: featureFlags.fileUpload,
          modelSelector: featureFlags.modelSelector,
        },
        features: {
          conversationHistory: featureFlags.conversationHistory,
        },
      }}
    />
  );
}
