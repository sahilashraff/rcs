import {
    PiHouseLineDuotone,
    PiSquaresFourDuotone,
    PiBuildingsDuotone,
    PiBroadcastDuotone,
    PiRobotDuotone,
    PiUsersDuotone,
    PiGearDuotone,
    PiArrowsInDuotone,
    PiBookOpenUserDuotone,
    PiBookBookmarkDuotone,
    PiBagSimpleDuotone,
    PiFileTextDuotone,
    PiFolderOpenDuotone,
} from 'react-icons/pi'
import type { JSX } from 'react'

export type NavigationIcons = Record<string, JSX.Element>

const navigationIcon: NavigationIcons = {
    home: <PiHouseLineDuotone />,
    dashboard: <PiSquaresFourDuotone />,
    tenants: <PiBuildingsDuotone />,
    carriers: <PiBroadcastDuotone />,
    agents: <PiRobotDuotone />,
    files: <PiFolderOpenDuotone />,
    onboardingRequests: <PiFileTextDuotone />,
    onboarding: <PiFileTextDuotone />,
    team: <PiUsersDuotone />,
    settings: <PiGearDuotone />,
    singleMenu: <PiSquaresFourDuotone />,
    collapseMenu: <PiArrowsInDuotone />,
    groupSingleMenu: <PiBookOpenUserDuotone />,
    groupCollapseMenu: <PiBookBookmarkDuotone />,
    groupMenu: <PiBagSimpleDuotone />,
}

export default navigationIcon

