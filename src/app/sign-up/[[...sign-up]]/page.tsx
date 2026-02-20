import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0f0f1a" }}>
            <SignUp routing="path" path="/sign-up" />
        </div>
    );
}
