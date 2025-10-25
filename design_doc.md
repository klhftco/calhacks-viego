VIEGO WALLET

Big idea: Forest x Zogo x Snackpass x Khan Academy

Prompt: Create a student‑centric wallet that automates campus payments (tuition installments, 
books, transit, meal plans) and nudges healthy financial behaviors. Use merchant enrichment to 
make transactions understandable, card controls to prevent accidental overspend, and offers to 
stretch budgets

Requirements:
Budgeting: goals, real‑time spend alerts, MCC‑based controls (e.g., cap food‑delivery). 
Acceptance: campus and off‑campus merchants; map nearby student essentials. 
Savings: apply relevant merchant offers automatically at checkout or post‑purchase.

Features:
Main Feature: Game-ified Savings
Be able to add friends and interact with network
Encourage good habits through keeping streaks and meeting financial spending goals
Students can create groups at the university level where other people can see their spending activity
Streaks can be rewarded by maintaining progress towards “unlocking” a new character
Create badges and achievement
Focus on encouraging meeting financial goals
Simple hatching mechanism: every time you meet a financial goal, make a step towards hatching an egg for a new “dinosaur” monster
More ambitious goals should give more progress towards growing monsters / hatching eggs
Have users start with some Pokemon starter monster that can grow as you save
Have either a realm or island where your creatures roam around
You can visit your friends’ islands

Budgeting: how to track and control spending
API: transaction controls
Financial automation: automate campus payments (tuition installments, transit)
Rent due date / rent reminder
Tuition reminders / autopay
Merchant Category Code -based controls: 
Custom spending limits users can set - maybe ai suggested
Have a default of $50 a week or something
Control transactions using this https://developer.visa.com/capabilities/vctc/docs 
Nudges healthy financial behaviors: rewarding rather than restricting
“You’re 80% to your savings goal - skip that $12 delivery fee and you’ll hit it by Friday!” vs You are over budget.
Main hatching feature
Income-based benchmarking: given a regular income, they can see/choose how their income is allocated

Acceptance: where students can use their card
API: Merchant Search/Locator
Create a map for students within a radius that shows where their card can be used using the 
Map nearby student essentials
Google Maps integration
Merchant search has a call to see what kind of payment is accepted
Array of strings
Indicates the payment acceptance method available at the 
Merchant enrichment: make transactions understandable based on merchant data from API

Savings: apply savings to merchants
API: Merchant Offers Resource Center
Utilize the Retrieve Offers from content id function
Whenever we spend at some accepted merchant, we want to check if the merchants have offers (not sure how this works yet, but ideally the API takes care of the transactions)
https://developer.visa.com/capabilities/visa-subscription-manager
Tell them before they make a purchase if they are nearing their spending limits 
