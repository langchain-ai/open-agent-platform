import NextLink from "next/link";
import Image from "next/image";
import { DOCS_LINK } from "@/constants";

export function HomePageInterface() {
  return (
    <div className="ml-36 flex min-h-screen w-full max-w-4xl flex-col items-start justify-center gap-16">
      <Image
        src="/oap-logo-dark.svg"
        alt="Open Agent Platform"
        width={409}
        height={36}
        className="-mb-1.5"
      />
      <p className="text-[112px] leading-[110%] -tracking-[2.25px] text-white">
        Build deep agents without code
      </p>
      <div className="flex gap-4">
        <NextLink
          href="/signup"
          className="cursor-pointer rounded-[64px] border border-white bg-white px-10 py-4 text-2xl font-medium text-black transition-colors duration-200 hover:bg-gray-100"
        >
          <p className="text-[#175166]">Sign Up</p>
        </NextLink>
        <a
          href={DOCS_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer rounded-[64px] border border-white bg-transparent px-10 py-4 text-2xl font-medium text-white transition-colors duration-200 hover:bg-gray-50/5"
        >
          Learn More
        </a>
      </div>
    </div>
  );
}
