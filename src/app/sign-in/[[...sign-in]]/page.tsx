import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0f0f1a" }}>
            <SignIn routing="path" path="/sign-in" />
        </div>
    );
}
