from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/scripts", tags=["scripts"])


class ScriptOut(BaseModel):
    id: str
    title: str
    slides: list[str]
    is_default: bool


DEFAULT_SCRIPTS: list[ScriptOut] = [
    ScriptOut(
        id="script_1",
        title="Someone Should Check",
        slides=[
            "That look on her face.",
            "The one she gets when she hasn't heard from you in days.",
            "You know the one.",
            "Someone should be checking on her.",
            "Now someone is.",
        ],
        is_default=True,
    ),
    ScriptOut(
        id="script_2",
        title="You Can't Be Everywhere",
        slides=[
            "You have a job. Kids. A life.",
            "But this face follows you. Into meetings. Into sleep.",
            "You can't be everywhere.",
            "We can.",
            "Check WellCare calls daily. Listens. Reports back.",
        ],
        is_default=True,
    ),
    ScriptOut(
        id="script_3",
        title="Break the Worry Cycle",
        slides=[
            "You know this feeling.",
            "Checking your phone. Wondering if she's okay.",
            "Every. Single. Day.",
            "What if you didn't have to worry anymore?",
            "We check in. So you can breathe.",
        ],
        is_default=True,
    ),
]


@router.get("/defaults", response_model=list[ScriptOut])
async def get_default_scripts():
    return DEFAULT_SCRIPTS
