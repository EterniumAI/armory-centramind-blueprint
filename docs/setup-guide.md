# The CentraMind Blueprint

Welcome in.

What you just downloaded is the exact setup I use every day to run my one-person company with an AI that never forgets me, never forgets the business, and shows up ready every time I open my laptop.

You don't need to be technical. You don't need to know what a database is. You don't need to have built software before. If you can follow a recipe, you can set this up in about fifteen minutes, and once you do, you'll have something most people don't even know is possible.

This guide is going to walk you through it like I would walk my own mom through it.

Let's go.

---

## What You're About To Have

Picture this.

You open your laptop in the morning. You say good morning to your AI. It already knows who you are, what you're working on, what you decided yesterday, and what's on fire right now. It doesn't ask you to explain yourself. It doesn't start from zero. It picks up exactly where you left off.

That's what this is.

I'm giving you the three things that make it work.

1. **A brain that remembers.** Every conversation, every decision, every note gets saved somewhere safe. Your AI can go back and read it any time.
2. **A dashboard.** A simple, beautiful page on your computer that shows you what your AI is doing and what it knows. You open it in your web browser, same way you open Facebook.
3. **A set of shortcuts.** Little commands your AI learns. "Give me my morning briefing." "Close out the day." You type one line, and it handles the rest.

Put together, this turns your AI from a chatbot that forgets you every time you close the window into something that feels like a real teammate.

And the whole thing is yours. Free. No subscription. No "pro tier" to unlock the good stuff.

---

## The Three Tools You Need

Before we start, you'll need three free accounts. I'll walk you through why each one exists so you're not flying blind.

**Claude.** This is the AI itself. Think of it as the person on the other end of the conversation. It's made by a company called Anthropic, and it's the smartest AI I've ever used for actually getting work done. You'll use the free app they make called Claude Code, which runs right on your computer.

**Supabase.** This is where your AI's memory lives. Every note, every log, every bit of context your AI collects gets saved here. It's free, it's safe, and you'll never have to touch it directly. Think of it as a filing cabinet your AI knows how to organize.

**GitHub.** This is where the actual code that makes everything work is stored. You'll download it once. Don't worry, you won't be writing any code yourself.

You'll also need something called **Node.js**, which is a little engine that runs the dashboard on your computer. You install it once and forget it exists. Same energy as installing a printer driver.

Five minutes to sign up for all three. Go do that now.

Links are at the back of this guide.

---

## The Setup, Step By Step

Follow these in order. Don't skip ahead.

### Step One. Download The Files

Open your web browser and go to this address:

```
github.com/EterniumAI/armory-centramind-blueprint
```

You'll see a green button that says **Code**. Click it. A small menu opens. Click **Download ZIP**.

A file lands in your downloads folder. Double-click it to unzip. You now have a folder called `armory-centramind-blueprint`. Drag it somewhere you'll remember. Your desktop works great.

That's it for step one.

### Step Two. Turn On The Memory

Go to **supabase.com** and log in. Click the big green **New Project** button.

Give it a name. I always name mine after whatever I'm building. Something like "my-ai-brain" is fine. Pick a password (save it somewhere safe), pick the region closest to where you live, and click **Create Project**.

Wait about a minute while it gets built. Go refill your coffee.

When it's ready, look on the left side of the screen for an icon that looks like a little database. Click it. A text editor opens in the middle of your screen.

Now open the folder you downloaded from GitHub. Inside it, find a folder called `supabase`, then another called `migrations`, and inside that, a file called `001_core_schema.sql`.

Open that file with any text editor (TextEdit on a Mac, Notepad on Windows). Select everything inside it. Copy it. Paste it into that text editor in Supabase, then click the green **Run** button.

A message appears saying it worked. Your AI now has a place to store its memories.

### Step Three. Give Your Copy The Keys

Still in Supabase, look at the very bottom of the left sidebar. Click the gear icon that says **Settings**. Then click **API**.

You'll see two things on this page that matter.

- A **Project URL** (looks like a web address)
- An **anon public** key (a long string of letters and numbers)

Go back to the folder you downloaded. Inside it, create a new blank text file. Name it exactly `.env`. Yes, with the dot at the front and nothing before it.

Open that file and paste these two lines in, replacing the placeholder with what you just copied from Supabase.

```
VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Save. Close. You just handed your copy the keys to its own memory.

### Step Four. Wake It Up

Open the terminal. (On a Mac, press Command-Space, type "terminal", hit enter. On Windows, open "Command Prompt". Same thing, different name.)

Type this, replacing the path with wherever you dragged your folder:

```
cd ~/Desktop/armory-centramind-blueprint
```

Then type:

```
npm install
```

And hit enter. Your computer will pull down all the pieces it needs. Watch the scrolling. Get a snack. When it stops, type:

```
npm run dev
```

Your terminal will show you a web address that looks like `http://localhost:5173`. Click it, or copy it into your browser.

Your dashboard appears. That's it. You're live.

---

## The Shortcut Path (If You Have Claude Code)

If you've already installed Claude Code on your computer, the setup compresses from fifteen minutes to five.

Open your terminal, navigate into the folder you downloaded, and type:

```
claude
```

Claude will boot up inside your terminal. Then tell it:

> Set this project up for me. My Supabase URL is [paste it] and my anon key is [paste it]. Run the migration, make the env file, and start the dev server.

Claude handles the rest. It reads the instructions that ship with the project, knows what to do, and tells you when it's ready.

This is the way.

---

## Your First Day Inside

You opened the dashboard. The setup is done. Now what?

Here are the four moves that unlock everything.

**One. Introduce yourself.** Open the file called `OWNER.md` in the folder you downloaded. Inside, there's a placeholder profile. Replace it with yours. What you're building, what you care about, what you want your AI to know about you. The more honest and specific you are here, the more your AI will feel like it actually knows you.

**Two. Write down what matters this week.** Open the file called `TODO.md`. Write three real tasks you want handled. Not aspirational goals. Real things with real deadlines. Your AI reads this every time it starts up and treats them like priorities.

**Three. Try your first shortcut.** In Claude Code, type `/standup`. Hit enter. Watch what happens. Your AI pulls your profile, your tasks, your recent history, and tells you what today looks like. This is what a real morning briefing feels like.

**Four. Close out your day.** When you're done working, type `/handoff`. Your AI writes a letter to itself, so tomorrow it remembers where you left off. No more starting from scratch. No more re-explaining yourself.

That's it. You now have continuity. You have memory. You have a dashboard. You have an AI that actually knows you.

Most people never get here. You just did.

---

## Make It Yours

This whole thing is MIT licensed. In plain English, that means you can do whatever you want with it. Use it. Change it. Rebrand it. Sell your own version. Run it inside your company. I'm not gatekeeping.

One file controls the entire look. It's called `theme.config.js` in the main folder. Open it. You'll see the colors. Change them. Everything updates. No hunting through code.

Make it feel like yours.

---

## When You Get Stuck

You will. Everybody does. Here's where to go.

**The Digital Armory.** This is the private community I run for people doing what you're doing. Real humans answer real questions. New plug-ins drop here first.

Join us at **tyrinbarney.com/community**

**My YouTube channel.** Full walkthroughs, real-time setups, the stories of what broke and how I fixed it. Subscribe if you want to see how this plays out in production.

**youtube.com/@tyrinbarney**

**The source code.** For when you're ready to look under the hood.

**github.com/EterniumAI/armory-centramind-blueprint**

---

## One Last Thing

Every business I run is built on top of this. The website you're reading from. The mobile apps shipping to clients. The content engine. The storefronts. All of it plugs into this exact foundation.

You now have the same starting point I do.

Go build.

Ty
