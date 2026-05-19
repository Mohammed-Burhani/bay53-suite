"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building2, MapPin, Upload, ArrowRight, ArrowLeft } from "lucide-react";
import { useCompanySetup } from "@/lib/hooks/useAuth";
import { toast } from "sonner";
import type { CompanySetupPayload } from "@/lib/types/auth.types";
import Image from "next/image";

const NATURE_OPTIONS = ["Retail", "Wholesale", "Distribution", "Trading", "Manufacturing", "Fabrication"] as const;

const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
];

export default function CompanySetupForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { mutate: setupCompany, isPending } = useCompanySetup();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<CompanySetupPayload>({
    defaultValues: {
      currency: "INR",
      natureOfBusiness: "Retail",
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("logo", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = async () => {
    let fieldsToValidate: (keyof CompanySetupPayload)[] = [];
    
    if (step === 1) {
      fieldsToValidate = ["companyName", "country", "address", "email", "phoneNumber"];
    } else if (step === 2) {
      fieldsToValidate = ["contactPerson", "gstNumber", "state", "pinCode"];
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const onSubmit = (data: CompanySetupPayload) => {
    setupCompany(data, {
      onError: (err) => {
        toast.error("Setup failed", {
          description: err.message || "Please try again",
        });
      },
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[40%] relative overflow-hidden bg-linear-to-br from-orange-50 via-teal-50 to-blue-50 border-r-2 border-gray-200">
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-30 blur-3xl animate-float"
            style={{ background: "radial-gradient(circle, var(--bay-coral) 0%, transparent 70%)" }}
          />
          <div 
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-30 blur-3xl animate-float-delayed"
            style={{ background: "radial-gradient(circle, var(--bay-teal) 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center p-12 w-full">
          <Image 
            src="/logo.png" 
            alt="BAY53 Logo" 
            width={200} 
            height={100}
            className="w-48 h-auto drop-shadow-lg mb-8"
          />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Complete Your Setup
          </h2>
          <p className="text-gray-600 text-lg">
            Just a few details to get your business up and running on BAY53.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-[60%] flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-2xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Step {step} of 2</span>
              <span className="text-sm text-gray-500">{Math.round((step / 2) * 100)}% Complete</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-300"
                style={{ 
                  width: `${(step / 2) * 100}%`,
                  background: "linear-gradient(135deg, var(--bay-coral), var(--bay-teal), var(--bay-violet))"
                }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Company Info */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div 
                    className="p-3 rounded-lg"
                    style={{ background: "linear-gradient(135deg, var(--bay-coral), var(--bay-teal))" }}
                  >
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Company Information</h3>
                    <p className="text-sm text-gray-600">Basic details about your business</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      placeholder="Enter company name"
                      {...register("companyName", { required: "Company name required" })}
                      className="mt-1"
                    />
                    {errors.companyName && (
                      <p className="text-sm text-red-600 mt-1">{errors.companyName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      placeholder="Enter country"
                      {...register("country", { required: "Country required" })}
                      className="mt-1"
                    />
                    {errors.country && (
                      <p className="text-sm text-red-600 mt-1">{errors.country.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="currency">Currency *</Label>
                    <Select
                      value={watch("currency")}
                      onValueChange={(value) => setValue("currency", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((curr) => (
                          <SelectItem key={curr.code} value={curr.code}>
                            {curr.symbol} {curr.name} ({curr.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      placeholder="Enter full address"
                      {...register("address", { required: "Address required" })}
                      className="mt-1"
                    />
                    {errors.address && (
                      <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="company@example.com"
                      {...register("email", { 
                        required: "Email required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email"
                        }
                      })}
                      className="mt-1"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="+91 1234567890"
                      {...register("phoneNumber", { required: "Phone required" })}
                      className="mt-1"
                    />
                    {errors.phoneNumber && (
                      <p className="text-sm text-red-600 mt-1">{errors.phoneNumber.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location & Tax + Logo */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <div 
                    className="p-3 rounded-lg"
                    style={{ background: "linear-gradient(135deg, var(--bay-teal), var(--bay-violet))" }}
                  >
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Location & Tax Details</h3>
                    <p className="text-sm text-gray-600">Regional and compliance information</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactPerson">Contact Person *</Label>
                    <Input
                      id="contactPerson"
                      placeholder="Full name"
                      {...register("contactPerson", { required: "Contact person required" })}
                      className="mt-1"
                    />
                    {errors.contactPerson && (
                      <p className="text-sm text-red-600 mt-1">{errors.contactPerson.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="gstNumber">GST Number *</Label>
                    <Input
                      id="gstNumber"
                      placeholder="22AAAAA0000A1Z5"
                      {...register("gstNumber", { required: "GST number required" })}
                      className="mt-1"
                    />
                    {errors.gstNumber && (
                      <p className="text-sm text-red-600 mt-1">{errors.gstNumber.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      placeholder="Enter state"
                      {...register("state", { required: "State required" })}
                      className="mt-1"
                    />
                    {errors.state && (
                      <p className="text-sm text-red-600 mt-1">{errors.state.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="pinCode">Pin Code *</Label>
                    <Input
                      id="pinCode"
                      placeholder="123456"
                      {...register("pinCode", { required: "Pin code required" })}
                      className="mt-1"
                    />
                    {errors.pinCode && (
                      <p className="text-sm text-red-600 mt-1">{errors.pinCode.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="natureOfBusiness">Nature of Business *</Label>
                    <Select
                      value={watch("natureOfBusiness")}
                      onValueChange={(value) => setValue("natureOfBusiness", value as typeof NATURE_OPTIONS[number])}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NATURE_OPTIONS.map((nature) => (
                          <SelectItem key={nature} value={nature}>
                            {nature}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="logo">Company Logo (Optional)</Label>
                    <div className="mt-2 flex items-center gap-4">
                      {logoPreview && (
                        <div className="w-20 h-20 rounded-lg border-2 border-gray-200 overflow-hidden">
                          <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <label className="cursor-pointer">
                        <div className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center gap-2">
                          <Upload className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-600">Upload Logo</span>
                        </div>
                        <input
                          id="logo"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}



            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/login")}
                >
                  Cancel
                </Button>
              )}

              {step < 2 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="gap-2"
                  style={{ 
                    background: "linear-gradient(135deg, var(--bay-coral), var(--bay-teal), var(--bay-violet))"
                  }}
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isPending}
                  className="gap-2"
                  style={{ 
                    background: "linear-gradient(135deg, var(--bay-coral), var(--bay-teal), var(--bay-violet))"
                  }}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    "Complete Setup"
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
