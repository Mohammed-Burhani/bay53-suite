"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Zap,
  BarChart3,
  Bell,
  Brain,
} from "lucide-react";
import Link from "next/link";

const steps = [
  {
    id: 1,
    title: "Welcome to StockBuddy",
    subtitle: "Your AI-Powered Inventory Management System",
    description:
      "Let's take you on a quick journey to show you how StockBuddy will transform your business operations.",
    icon: Sparkles,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: 2,
    title: "Set Up Your Inventory",
    subtitle: "Start with the basics",
    description:
      "Add your products, set stock levels, and organize by categories. Our intuitive interface makes it quick and easy.",
    icon: Package,
    color: "from-blue-500 to-cyan-500",
    actions: [
      { label: "Add Products", href: "/inventory/add" },
      { label: "Manage Categories", href: "/inventory/categories" },
    ],
  },
  {
    id: 3,
    title: "Add Your Parties",
    subtitle: "Customers & Suppliers",
    description:
      "Register your customers and suppliers with complete contact details. Track receivables and payables effortlessly.",
    icon: Users,
    color: "from-green-500 to-emerald-500",
    actions: [
      { label: "Add Customer", href: "/parties/customers" },
      { label: "Add Supplier", href: "/parties/suppliers" },
    ],
  },
  {
    id: 4,
    title: "Start Selling",
    subtitle: "Create your first sale",
    description:
      "Use our POS system or create detailed invoices. Track payments, manage returns, and keep your cash flow healthy.",
    icon: ShoppingCart,
    color: "from-orange-500 to-red-500",
    actions: [
      { label: "Point of Sale", href: "/pos" },
      { label: "Create Invoice", href: "/sales/create" },
    ],
  },
  {
    id: 5,
    title: "Track Everything",
    subtitle: "Real-time insights",
    description:
      "Monitor sales, inventory levels, and financial metrics. Get instant reports on GST, purchases, and profitability.",
    icon: BarChart3,
    color: "from-indigo-500 to-purple-500",
    actions: [
      { label: "View Dashboard", href: "/dashboard" },
      { label: "Reports", href: "/reports" },
    ],
  },
  {
    id: 6,
    title: "Meet Your AI Assistant",
    subtitle: "Your 24/7 business advisor",
    description:
      "Ask anything about your business. Get instant insights, recommendations, and alerts. It's like having a business analyst on call.",
    icon: Brain,
    color: "from-pink-500 to-rose-500",
    actions: [{ label: "Chat with AI", href: "/ai-assistant" }],
  },
];

const aiFeatures = [
  {
    icon: MessageSquare,
    title: "Natural Conversations",
    description: "Ask questions in plain English, get instant answers",
  },
  {
    icon: Zap,
    title: "Real-time Data",
    description: "Access live inventory, sales, and financial data",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Get notified about low stock, pending payments, and more",
  },
  {
    icon: TrendingUp,
    title: "Business Insights",
    description: "Receive actionable recommendations to grow your business",
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsComplete(true);
  };

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-8 inline-block"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
          >
            You're All Set!
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-muted-foreground mb-8"
          >
            Your journey with StockBuddy begins now. Start managing your
            inventory smarter, not harder.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <Link href="/dashboard">
              <Button size="lg" className="gap-2">
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/ai-assistant">
              <Button size="lg" variant="outline" className="gap-2">
                <Brain className="w-4 h-4" />
                Try AI Assistant
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <div className="w-full max-w-6xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip Tour
            </Button>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((s, index) => (
            <motion.button
              key={s.id}
              onClick={() => setCurrentStep(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentStep
                  ? "bg-purple-500 w-8"
                  : index < currentStep
                  ? "bg-purple-300"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>

        {/* Main Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8 md:p-12 shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left Side - Icon & Text */}
              <div>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="mb-6"
                >
                  <div
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                </motion.div>

                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl md:text-4xl font-bold mb-2"
                >
                  {step.title}
                </motion.h2>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`text-lg font-medium mb-4 bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}
                >
                  {step.subtitle}
                </motion.p>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-muted-foreground text-lg leading-relaxed"
                >
                  {step.description}
                </motion.p>

                {step.actions && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 flex flex-wrap gap-3"
                  >
                    {step.actions.map((action, index) => (
                      <Link key={index} href={action.href}>
                        <Button variant="outline" className="gap-2">
                          {action.label}
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Right Side - Visual Content */}
              <div>
                {currentStep === steps.length - 1 ? (
                  // AI Features Grid
                  <div className="grid grid-cols-2 gap-4">
                    {aiFeatures.map((feature, index) => {
                      const FeatureIcon = feature.icon;
                      return (
                        <motion.div
                          key={index}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1 * index, type: "spring" }}
                        >
                          <Card className="p-4 hover:shadow-lg transition-shadow border-2 hover:border-purple-300">
                            <FeatureIcon className="w-8 h-8 mb-2 text-purple-500" />
                            <h3 className="font-semibold mb-1 text-sm">
                              {feature.title}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {feature.description}
                            </p>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  // Animated Illustration
                  <motion.div
                    className="relative h-64 md:h-80"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div
                      className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.color} opacity-20`}
                      animate={{
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      animate={{
                        y: [0, -10, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Icon className={`w-32 h-32 text-gradient-to-br ${step.color}`} />
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Navigation Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-between items-center mt-8"
        >
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Previous
          </Button>

          <Button onClick={handleNext} className="gap-2" size="lg">
            {currentStep === steps.length - 1 ? "Get Started" : "Next"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
