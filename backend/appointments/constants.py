"""
Appointments Module — Constants
"""

TRIAGE_LEVEL_1 = 1
TRIAGE_LEVEL_2 = 2
TRIAGE_LEVEL_3 = 3
TRIAGE_LEVEL_4 = 4
TRIAGE_LEVEL_5 = 5

TRIAGE_LEVEL_CHOICES = [
    (TRIAGE_LEVEL_1, 'Level 1 - Immediate (Life-threatening)'),
    (TRIAGE_LEVEL_2, 'Level 2 - Emergent (< 15 min)'),
    (TRIAGE_LEVEL_3, 'Level 3 - Urgent (< 60 min)'),
    (TRIAGE_LEVEL_4, 'Level 4 - Semi-urgent (< 120 min)'),
    (TRIAGE_LEVEL_5, 'Level 5 - Non-urgent (< 240 min)'),
]

TRIAGE_LEVEL_LABELS = {
    TRIAGE_LEVEL_1: 'Immediate',
    TRIAGE_LEVEL_2: 'Emergent',
    TRIAGE_LEVEL_3: 'Urgent',
    TRIAGE_LEVEL_4: 'Semi-urgent',
    TRIAGE_LEVEL_5: 'Non-urgent',
}

TRIAGE_LEVEL_COLORS = {
    TRIAGE_LEVEL_1: 'bg-red-100 text-red-800 border-red-300',
    TRIAGE_LEVEL_2: 'bg-orange-100 text-orange-800 border-orange-300',
    TRIAGE_LEVEL_3: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    TRIAGE_LEVEL_4: 'bg-green-100 text-green-800 border-green-300',
    TRIAGE_LEVEL_5: 'bg-blue-100 text-blue-800 border-blue-300',
}