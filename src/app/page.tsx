import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <SignedOut>
          <SignInButton mode="modal">
            <Button>
              Sign in
            </Button>
          </SignInButton>
        <SignUpButton mode="modal" >
            <Button variant="secondary">
              Sign up
            </Button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  );
}
