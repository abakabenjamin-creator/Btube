"""Visual plan, line by line (index = line in script.txt).
VO lines: BROLL[i] = list of Mixkit clip ids, one per sentence (cycled), or CARD[i] = a graph card.
Presenter lines: chest captions; SIDE = rule moments (original framing first, slide, then text)."""

# ---- stock footage under the voiceover (one clip per sentence of the line, in order)
BROLL = {
    4:  [20551, 20736],                       # three drains open... / all at once
    8:  [46994, 24890, 11658, 26089],         # rent / groceries / phone upgrade / takeout
    10: [18263, 18299, 21911, 21911],         # what's left... forty bucks / nothing / sits in checking
    31: [47627, 18304, 23476, 15853],         # tax refund / free money / financed car / furniture plan
    32: [39841, 46994],                       # paychecks spoken for / 18-24%
    37: [34278, 13260, 8875, 8875, 38501],    # shoes / tire / groceries / yes groceries / due dates
    39: [23989, 23989, 37051],                # blunt rule / nothing that loses value / property or business
    45: [23524, 47734],                       # highest-rate card / next one down
    51: [43851, 49233, 39790, 47363],         # it's you crying / wreck / wire money / grabbing her keys
    53: [46627, 49247],                       # it isn't you / cloned your voice
    67: [38512, 38512, 23046],                # beneficiaries + trust / skip probate / spouse and kids
    70: [47687, 16104, 35426],                # lawyers paid / two heirs? / died waiting
}
# stock clip shown behind a 'dim' card
DIMBG = {5: 20551, 12: 31969, 14: 38481, 22: 42627, 24: 47214, 33: 15914, 42: 4806, 55: 49126, 59: 46627,
         61: 35902, 63: 36780, 74: 23046}

# ---- chapter pill (top-left), starts at the line
CHAPTERS = {0: 'Simon & Solomon', 7: 'Drain 1', 16: 'Rule 1', 29: 'Drain 2', 40: 'Rule 2', 49: 'Drain 3', 57: 'Rule 3',
            64: 'The will', 74: 'Recap'}

# ---- rule moments on the front camera: original framing first, slide him aside, then the words (DNA)
SIDES = [
    dict(lines=(16, 17), heading='Rule 1', body=['Pay the future *first*', 'Emergency fund', 'House down payment', 'Car fund']),
    dict(lines=(40, 41), heading='Rule 2', body=['Debt has to *earn its keep*', 'This weekend: paper, not an app']),
    dict(lines=(57, 58), heading='Rule 3', body=['*Protect* it all', 'A family safeword', 'No word? Hang up. Call back.']),
]
# words that turn yellow (one per caption line) / green (money up) / impact lines
KEY = {'grand': 'y', 'invested.': 'g', 'drains': 'y', 'weekend.': 'y', 'tired.': 'y', 'responsible.': 'y',
       'transmission.': 'y', 'lazy.': 'y', 'backwards.': 'y', 'worse.': 'y', 'smaller.': 'y', 'sneakier.': 'y', 'one?': 'y',
       'enjoy': 'y', 'mostly.': 'y', 'afternoon.': 'y', 'ringing.': 'y', 'exaggerating.': 'y', 'herself.': 'y',
       'paranoia.': 'y', 'happens?': 'y', 'hear.': 'y', 'probate': 'y', 'me.': 'y', 'paperwork.': 'y', 'one.': 'y',
       'comments.': 'y', 'breathing': 'y', 'annoying.': 'y', 'disaster.': 'y', 'drain': 'y', 'checking.': 'y', 'raid': 'y'}
IMPACT = {2, 48, 54, 60}   # short shocking lines in Inter Black
