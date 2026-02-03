import { uid } from "../../lib/ids";
import { loadJSON, saveJSON } from "../../lib/storage";

export type EmploymentType = "Full-time" | "Part-time" | "Contractor" | "Intern";
export type EmploymentStatus = "Active" | "Invited" | "Inactive";
export type PayPeriod = "Annual" | "Hourly";
export type LegacyLevel = "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | "L7";

export type Employee = {
  id: string;
  fullName: string;
  preferredName?: string;
  profilePhoto?: string;
  dateOfBirth?: string;
  homeAddress?: string;
  phone?: string;
  personalEmail?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  gender?: string;
  timezone?: string;
  email: string;
  department: string;
  team: string;
  legalEntity?: string;
  jurisdiction?: string;
  teamMemberships?: string;
  costCenter?: string;
  division?: string;
  businessUnit?: string;
  matrixManagerId?: string | null;
  title: string;
  managerId: string | null;
  location: string;
  workSchedule?: string;
  employmentType: EmploymentType;
  baseSalary: number;
  currency: "USD";
  status: EmploymentStatus;
  startDate: string;
  terminationDate?: string;
  endDate?: string;
  name?: string;
  workLocation?: string;
  payPeriod?: PayPeriod;
  level?: LegacyLevel;
  cashComp?: number;
  targetBonusPct?: number;
  compCurrency?: "USD";
};

export const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Sales",
  "Marketing",
  "Finance",
  "HR",
  "IT",
  "Customer Support",
  "Operations",
  "Legal",
  "Executives",
];

const KEY = "rbp_people_v3";
const LASTNAME_MIGRATION_KEY = "rbp_people_lastname_migration_v1";

function normalizeEmployee(employee: Employee): Employee {
  const preferredName = employee.preferredName ?? employee.fullName.split(" ")[0];
  const personalEmail = employee.personalEmail ?? employee.email.replace("@opusguard.com", "@personalmail.com");
  const timezone = employee.timezone ?? "America/Los_Angeles";
  const workSchedule = employee.workSchedule ?? "Mon–Fri, 9am–5pm";
  const teamMemberships = employee.teamMemberships ?? employee.team;
  const matrixManagerId = employee.matrixManagerId ?? null;
  const payPeriod = employee.payPeriod ?? (employee.employmentType === "Contractor" ? "Hourly" : "Annual");
  const seniorTitle = /CEO|CTO|VP|Director|Head/i.test(employee.title);
  const level = employee.level ?? (employee.department === "Executives" ? "L7" : seniorTitle ? "L6" : "L3");
  const targetBonusPct = employee.targetBonusPct ?? (employee.department === "Executives" ? 20 : seniorTitle ? 15 : 10);

  return {
    ...employee,
    preferredName,
    profilePhoto: employee.profilePhoto ?? "",
    dateOfBirth: employee.dateOfBirth ?? "",
    homeAddress: employee.homeAddress ?? "",
    phone: employee.phone ?? "",
    personalEmail,
    emergencyContactName: employee.emergencyContactName ?? "",
    emergencyContactPhone: employee.emergencyContactPhone ?? "",
    gender: employee.gender ?? "",
    timezone,
    workSchedule,
    terminationDate: employee.terminationDate ?? "",
    endDate: employee.endDate ?? employee.terminationDate ?? "",
    teamMemberships,
    costCenter: employee.costCenter ?? "CC-1001",
    division: employee.division ?? "Corporate",
    businessUnit: employee.businessUnit ?? "People Ops",
    legalEntity: employee.legalEntity ?? "Opus Guard Inc.",
    jurisdiction: employee.jurisdiction ?? "CA",
    matrixManagerId,
    name: employee.name ?? employee.fullName,
    workLocation: employee.workLocation ?? employee.location,
    payPeriod,
    level,
    cashComp: employee.cashComp ?? employee.baseSalary,
    targetBonusPct,
    compCurrency: "USD",
  };
}

function seedEmployees(): Employee[] {
  const employees: Employee[] = [];
  const usedEmails = new Set<string>();

  const firstNames = [
    "Darin", "Shu", "Priya", "Marcus", "Elena", "Jonah", "Tessa", "Omar", "Kira", "Leo",
    "Avery", "Jordan", "Riley", "Cameron", "Quinn", "Parker", "Sage", "Rowan", "Morgan", "Taylor",
    "Casey", "Reese", "Logan", "Harper", "Emery", "Kai", "Ari", "Noah", "Maya", "Nina",
    "Theo", "Jude", "Lena", "Zara", "Iris", "Levi", "Jasper", "Eden", "Miles", "Nora",
  ];
  // Keep "LaFramboise" for the CEO, but avoid generating large blocks of it for seeded employees.
  const generatedLastNames = [
    "Shen", "Desai", "Lee", "Park", "Green", "Alvarez", "Khalid", "Novak", "Brooks",
    "Nguyen", "Patel", "Kim", "Garcia", "Brown", "Singh", "Lopez", "Chen", "Davis", "Miller",
    "Wilson", "Martinez", "Clark", "Lewis", "Walker", "Hall", "Allen", "Young", "Hernandez", "King",
    "Wright", "Hill", "Scott", "Torres", "Bennett", "Reed", "Campbell", "Perry", "Barnes", "Price",
    "Rivera", "Cooper", "Bailey", "Bell", "Gomez", "Diaz", "Foster", "Gray", "Howard", "Russell",
    "Griffin", "Sullivan", "Baker", "Cox", "Ward", "Peterson", "Ramirez", "Jenkins", "Parker", "Evans",
    "Edwards", "Collins", "Stewart", "Sanchez", "Morris", "Rogers", "Cook", "Morgan", "Murphy", "Hughes",
    "Flores", "Gonzalez", "Nelson", "Carter", "Mitchell", "Roberts", "Turner", "Phillips", "Campbell",
    "Patterson", "Richardson", "Cruz", "Ortiz", "Chavez", "Vasquez", "Castillo", "Romero", "Mendez",
    "Gutierrez", "Sanders", "Ross", "Reynolds", "Fisher", "Harrison", "Hamilton", "Graham", "Sims",
    "Fowler", "Bishop", "Holland", "Pierce", "Hoffman", "Carpenter", "Manning", "Dunn", "Hunt",
    "Webb", "Wells", "Stone", "Hansen", "Rojas", "Soto", "Aguilar", "Silva", "Barrett", "Fitzgerald",
    "Stephens", "McCarthy", "Olsen", "Mendoza", "Hawkins", "Tucker", "Fleming", "Schmidt", "Weber",
    "Keller", "Henderson", "Richards", "Hays", "Duncan", "Greene", "Horton", "Wagner", "Vaughn",
    "Snyder", "Hart", "Cunningham", "Ferguson", "Marshall", "Hunter", "Spencer", "Carr", "George",
    "Lambert", "Oliver", "Dean", "Walters", "Gibson", "Moss", "Ford", "Pearson", "Hammond",
  ];

  function hash32(n: number) {
    // Deterministic integer hash so seeded data is stable across reloads.
    let x = n | 0;
    x ^= x >>> 16;
    x = Math.imul(x, 0x7feb352d);
    x ^= x >>> 15;
    x = Math.imul(x, 0x846ca68b);
    x ^= x >>> 16;
    return x >>> 0;
  }

  function pickGeneratedLastName(seed: number) {
    return generatedLastNames[hash32(seed) % generatedLastNames.length];
  }

  const locations = [
    { name: "Headquarters", timezone: "America/Los_Angeles" },
    { name: "Remote", timezone: "America/Los_Angeles" },
    { name: "NYC", timezone: "America/New_York" },
    { name: "Austin", timezone: "America/Chicago" },
    { name: "Chicago", timezone: "America/Chicago" },
    { name: "London", timezone: "Europe/London" },
    { name: "Toronto", timezone: "America/Toronto" },
  ];

  const locationJurisdiction: Record<string, string> = {
    Headquarters: "CA",
    Remote: "CA",
    NYC: "NY",
    Austin: "TX",
    Chicago: "IL",
    London: "UK",
    Toronto: "ON",
  };

  const legalEntityByLocation: Record<string, string> = {
    London: "Opus Guard UK Ltd.",
    Toronto: "Opus Guard Canada ULC",
  };

  const divisionByDept: Record<string, string> = {
    Engineering: "Product & Engineering",
    Product: "Product & Engineering",
    Design: "Product & Engineering",
    Sales: "Revenue",
    Marketing: "Revenue",
    "Customer Support": "Customer Success",
    Operations: "Operations",
    Finance: "Operations",
    HR: "Operations",
    IT: "Operations",
    Legal: "Operations",
    Executives: "Corporate",
  };

  let nameIndex = 0;

  const formatDate = (date: Date) => {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${mm}/${dd}/${date.getFullYear()}`;
  };

  const makeName = () => {
    const first = firstNames[nameIndex % firstNames.length];
    const base = nameIndex;
    let last = pickGeneratedLastName(base);
    // Occasionally generate a compound last name for more variety.
    if (hash32(base + 91) % 13 === 0) {
      let other = pickGeneratedLastName(base + 1337);
      if (other === last) other = pickGeneratedLastName(base + 7331);
      last = `${last}-${other}`;
    }
    nameIndex += 1;
    return `${first} ${last}`;
  };

  const makeEmail = (fullName: string) => {
    const base = fullName.toLowerCase().replace(/[^a-z]/g, ".");
    let email = `${base}@opusguard.com`;
    let counter = 1;
    while (usedEmails.has(email)) {
      counter += 1;
      email = `${base}.${counter}@opusguard.com`;
    }
    usedEmails.add(email);
    return email;
  };

  const pickLocation = (index: number) => locations[index % locations.length];

  const calcSalary = (title: string) => {
    if (/Chief|CEO|CTO|CFO|COO|CPO|CHRO|CRO/i.test(title)) return 260000;
    if (/VP|Vice President/i.test(title)) return 210000;
    if (/Director/i.test(title)) return 180000;
    if (/Manager/i.test(title)) return 140000;
    if (/Senior/i.test(title)) return 125000;
    if (/Counsel|Attorney/i.test(title)) return 165000;
    return 95000;
  };

  const pickStatus = (index: number) => {
    if (index % 37 === 0) return "Inactive" as EmploymentStatus;
    if (index % 23 === 0) return "Invited" as EmploymentStatus;
    return "Active" as EmploymentStatus;
  };

  const makeEmployee = (partial: Partial<Employee> & { fullName: string; department: string; title: string; managerId: string | null; team: string }) => {
    const loc = partial.location ? { name: partial.location, timezone: partial.timezone ?? "America/Los_Angeles" } : pickLocation(employees.length);
    const employmentType = partial.employmentType ?? (
      employees.length % 17 === 0 ? "Intern" :
      employees.length % 11 === 0 ? "Part-time" :
      employees.length % 9 === 0 ? "Contractor" :
      "Full-time"
    );
    const startBase = new Date(2023, 0, 15);
    const startDate = partial.startDate ?? formatDate(new Date(startBase.getTime() + employees.length * 8 * 24 * 60 * 60 * 1000));
    const baseSalary = partial.baseSalary ?? calcSalary(partial.title);
    const status = partial.status ?? pickStatus(employees.length);
    const email = partial.email ?? makeEmail(partial.fullName);
    const teamMemberships = partial.teamMemberships ?? partial.team;
    const jurisdiction = partial.jurisdiction ?? locationJurisdiction[loc.name] ?? "CA";
    const legalEntity = partial.legalEntity ?? legalEntityByLocation[loc.name] ?? "Opus Guard Inc.";
    const terminationDate =
      partial.terminationDate ??
      (status === "Inactive" ? formatDate(new Date(startBase.getTime() + employees.length * 10 * 24 * 60 * 60 * 1000)) : "");

    const employee: Employee = {
      id: uid("emp"),
      fullName: partial.fullName,
      preferredName: partial.preferredName,
      profilePhoto: partial.profilePhoto ?? "",
      dateOfBirth: partial.dateOfBirth ?? "",
      homeAddress: partial.homeAddress ?? "",
      phone: partial.phone ?? "",
      personalEmail: partial.personalEmail ?? "",
      emergencyContactName: partial.emergencyContactName ?? "",
      emergencyContactPhone: partial.emergencyContactPhone ?? "",
      gender: partial.gender ?? "",
      timezone: partial.timezone ?? loc.timezone,
      email,
      department: partial.department,
      team: partial.team,
      teamMemberships,
      costCenter: partial.costCenter ?? `CC-${1000 + DEPARTMENTS.indexOf(partial.department)}`,
      division: partial.division ?? divisionByDept[partial.department] ?? "Corporate",
      businessUnit: partial.businessUnit ?? "Opus Guard",
      matrixManagerId: partial.matrixManagerId ?? null,
      title: partial.title,
      managerId: partial.managerId,
      location: loc.name,
      workSchedule: partial.workSchedule ?? (partial.department === "Customer Support" ? "Tue–Sat, 10am–6pm" : "Mon–Fri, 9am–5pm"),
      employmentType,
      baseSalary,
      currency: "USD",
      status,
      startDate,
      terminationDate,
      endDate: terminationDate,
      name: partial.fullName,
      workLocation: loc.name,
      payPeriod: partial.payPeriod,
      level: partial.level,
      cashComp: baseSalary,
      targetBonusPct: partial.targetBonusPct,
      compCurrency: "USD",
      jurisdiction,
      legalEntity,
    };

    const normalized = normalizeEmployee(employee);
    employees.push(normalized);
    return normalized;
  };

  const boardChair = makeEmployee({
    fullName: "Jordan Whitaker",
    department: "Executives",
    team: "Board",
    title: "Board Chair",
    managerId: null,
    status: "Active",
    location: "Headquarters",
  });

  const ceo = makeEmployee({
    fullName: "Darin LaFramboise",
    department: "Executives",
    team: "Executive",
    title: "CEO",
    managerId: boardChair.id,
    status: "Active",
    location: "Headquarters",
  });

  const cto = makeEmployee({ fullName: "Shu Shen", department: "Executives", team: "Executive", title: "CTO", managerId: ceo.id, location: "Remote", status: "Active" });
  const coo = makeEmployee({ fullName: "Avery Brooks", department: "Executives", team: "Executive", title: "COO", managerId: ceo.id, location: "Headquarters", status: "Active" });
  const cfo = makeEmployee({ fullName: "Nina Patel", department: "Executives", team: "Executive", title: "CFO", managerId: ceo.id, location: "Headquarters", status: "Active" });
  const cpo = makeEmployee({ fullName: "Marcus Lee", department: "Executives", team: "Executive", title: "CPO", managerId: ceo.id, location: "NYC", status: "Active" });
  const chro = makeEmployee({ fullName: "Kira Novak", department: "Executives", team: "Executive", title: "CHRO", managerId: ceo.id, location: "Headquarters", status: "Active" });
  const cro = makeEmployee({ fullName: "Jonah Green", department: "Executives", team: "Executive", title: "CRO", managerId: ceo.id, location: "Chicago", status: "Active" });

  const addTeamManagers = (dept: string, leaderId: string, managerTitle: string, teams: string[]) => {
    return teams.map((team) =>
      makeEmployee({
        fullName: makeName(),
        department: dept,
        team,
        title: managerTitle,
        managerId: leaderId,
        status: "Active",
      })
    );
  };

  const addICs = (dept: string, managers: Employee[], titles: string[], count: number) => {
    for (let i = 0; i < count; i += 1) {
      const manager = managers[i % managers.length];
      const title = titles[i % titles.length];
      makeEmployee({
        fullName: makeName(),
        department: dept,
        team: manager.team,
        title,
        managerId: manager.id,
        employmentType: dept === "Design" || dept === "Marketing" ? (i % 6 === 0 ? "Contractor" : "Full-time") : undefined,
      });
    }
  };

  // Engineering (45)
  const vpEng = makeEmployee({ fullName: "Priya Desai", department: "Engineering", team: "Engineering Leadership", title: "VP Engineering", managerId: cto.id, location: "Austin", status: "Active" });
  const engManagers = addTeamManagers("Engineering", vpEng.id, "Engineering Manager", ["Platform", "Infrastructure", "Security", "Applications"]);
  addICs("Engineering", engManagers, ["Software Engineer", "Senior Software Engineer", "Staff Engineer", "QA Engineer"], 40);

  // Product (12)
  const vpProduct = makeEmployee({ fullName: "Elena Park", department: "Product", team: "Product Leadership", title: "VP Product", managerId: cpo.id, location: "NYC", status: "Active" });
  const productManagers = addTeamManagers("Product", vpProduct.id, "Group Product Manager", ["Core Product", "Growth"]);
  addICs("Product", productManagers, ["Product Manager", "Product Analyst"], 9);

  // Design (8)
  const designDirector = makeEmployee({ fullName: "Tessa Alvarez", department: "Design", team: "Design Leadership", title: "Design Director", managerId: cpo.id, location: "Remote", status: "Active" });
  const designManagers = addTeamManagers("Design", designDirector.id, "Design Manager", ["Product Design", "Brand"]);
  addICs("Design", designManagers, ["Product Designer", "UX Researcher"], 5);

  // Sales (25)
  const vpSales = makeEmployee({ fullName: "Logan Reed", department: "Sales", team: "Sales Leadership", title: "VP Sales", managerId: cro.id, location: "Chicago", status: "Active" });
  const salesManagers = addTeamManagers("Sales", vpSales.id, "Sales Manager", ["Enterprise", "Mid-Market", "SMB"]);
  addICs("Sales", salesManagers, ["Account Executive", "Sales Development Rep"], 21);

  // Marketing (10)
  const marketingDirector = makeEmployee({ fullName: "Maya Chen", department: "Marketing", team: "Marketing Leadership", title: "Marketing Director", managerId: cro.id, location: "Remote", status: "Active" });
  const marketingManagers = addTeamManagers("Marketing", marketingDirector.id, "Marketing Manager", ["Demand Gen", "Content"]);
  addICs("Marketing", marketingManagers, ["Growth Marketer", "Content Strategist"], 7);

  // Customer Support (15)
  const supportDirector = makeEmployee({ fullName: "Casey Morales", department: "Customer Support", team: "Support Leadership", title: "Support Director", managerId: coo.id, location: "Austin", status: "Active" });
  const supportManagers = addTeamManagers("Customer Support", supportDirector.id, "Support Manager", ["Customer Success", "Technical Support", "Onboarding"]);
  addICs("Customer Support", supportManagers, ["Customer Success Manager", "Support Specialist"], 11);

  // Operations (8)
  const opsDirector = makeEmployee({ fullName: "Reese Campbell", department: "Operations", team: "Operations Leadership", title: "Operations Director", managerId: coo.id, location: "Headquarters", status: "Active" });
  const opsManagers = addTeamManagers("Operations", opsDirector.id, "Operations Manager", ["Biz Ops", "Facilities"]);
  addICs("Operations", opsManagers, ["Operations Specialist", "Facilities Coordinator"], 5);

  // Finance (6)
  const financeDirector = makeEmployee({ fullName: "Omar Khalid", department: "Finance", team: "Finance Leadership", title: "Finance Director", managerId: cfo.id, location: "Headquarters", status: "Active" });
  const financeManagers = addTeamManagers("Finance", financeDirector.id, "Finance Manager", ["FP&A"]);
  addICs("Finance", financeManagers, ["FP&A Analyst", "Accountant"], 4);

  // HR (5)
  const hrDirector = makeEmployee({ fullName: "Lena Wright", department: "HR", team: "People Leadership", title: "Head of People", managerId: chro.id, location: "Headquarters", status: "Active" });
  const hrManagers = addTeamManagers("HR", hrDirector.id, "People Ops Manager", ["People Ops"]);
  addICs("HR", hrManagers, ["Recruiter", "People Ops Specialist"], 3);

  // IT (6)
  const itDirector = makeEmployee({ fullName: "Leo Brooks", department: "IT", team: "IT Leadership", title: "IT Director", managerId: coo.id, location: "Austin", status: "Active" });
  const itManagers = addTeamManagers("IT", itDirector.id, "IT Manager", ["IT Operations"]);
  addICs("IT", itManagers, ["IT Admin", "Systems Engineer"], 4);

  // Legal (2)
  const generalCounsel = makeEmployee({ fullName: "Nora Bennett", department: "Legal", team: "Legal", title: "General Counsel", managerId: cfo.id, location: "NYC", status: "Active" });
  addICs("Legal", [generalCounsel], ["Paralegal"], 1);

  return employees;
}

export function getEmployees(): Employee[] {
  const stored = loadJSON<Employee[] | null>(KEY, null);
  if (stored && stored.length > 0) {
    let normalized = stored.map((emp) => normalizeEmployee(emp));

    // One-time migration: older seeds produced large blocks of the same last name ("LaFramboise").
    // Keep the CEO as-is, but diversify generated employees so the dataset feels realistic.
    const migratedFlag = loadJSON<boolean>(LASTNAME_MIGRATION_KEY, false);
    if (!migratedFlag) {
      const lastToken = (name: string) => {
        const parts = name.trim().split(/\s+/);
        return parts.length ? parts[parts.length - 1] : "";
      };

      const laCount = normalized.filter((e) => lastToken(e.fullName) === "LaFramboise").length;
      if (laCount > 6) {
        const usedFullNames = new Set(normalized.map((e) => e.fullName));

        let seed = normalized.length * 17;
        const pickFrom = (arr: string[]) => {
          seed += 1;
          const idx = (seed * 1103515245 + 12345) >>> 0;
          return arr[idx % arr.length];
        };

        const newLastPool = normalized
          .map((e) => lastToken(e.fullName))
          .filter((ln) => ln && ln !== "LaFramboise");

        const pool = newLastPool.length > 25 ? newLastPool : [
          "Rivera","Cooper","Bailey","Bell","Gomez","Diaz","Foster","Gray","Howard","Russell",
          "Griffin","Sullivan","Baker","Ward","Ramirez","Jenkins","Evans","Collins","Stewart","Sanchez",
          "Rogers","Mitchell","Roberts","Turner","Phillips","Cruz","Ortiz","Chavez","Castillo","Romero",
        ];

        normalized = normalized.map((e) => {
          if (e.fullName === "Darin LaFramboise") return e;
          if (lastToken(e.fullName) !== "LaFramboise") return e;

          const parts = e.fullName.trim().split(/\s+/);
          const first = parts[0] || e.fullName;
          let nextName = e.fullName;
          for (let i = 0; i < 8; i += 1) {
            const last = pickFrom(pool);
            const candidate = `${first} ${last}`;
            if (!usedFullNames.has(candidate)) {
              nextName = candidate;
              usedFullNames.add(candidate);
              break;
            }
          }

          return { ...e, fullName: nextName, name: nextName };
        });

        saveJSON(LASTNAME_MIGRATION_KEY, true);
      } else {
        saveJSON(LASTNAME_MIGRATION_KEY, true);
      }
    }

    saveJSON(KEY, normalized);
    return normalized;
  }
  const seeded = seedEmployees().map((emp) => normalizeEmployee(emp));
  saveJSON(KEY, seeded);
  return seeded;
}

export function updateEmployees(updatedEmployees: Employee[]) {
  saveJSON(KEY, updatedEmployees.map((emp) => normalizeEmployee(emp)));
}
