import { Location, Category } from '../types';

export const DELSU_LOCATIONS: Location[] = [
  // Faculties
  {
    id: 'fac-science',
    name: 'Faculty of Science',
    category: Category.FACULTY,
    description: 'Home to Biological, Chemical, Computer Science, and Physical science departments.',
    lat: 5.798884311602667,
    lng: 6.122984463284406,
    aliases: ['Science Faculty', 'Faculty of Science', 'Pure Sciences']
  },
  {
    id: 'fac-arts',
    name: 'Faculty of Arts',
    category: Category.FACULTY,
    description: 'Center for humanities, languages, theatre, and cultural studies.',
    lat: 5.798898994183928,
    lng: 6.122965509016365,
    aliases: ['Arts Faculty', 'Faculty of Art', 'Humanities']
  },
  {
    id: 'fac-edu',
    name: 'Faculty of Education',
    category: Category.FACULTY,
    description: 'The major faculty complex training future educators.',
    lat: 5.790801764623164,
    lng: 6.120976637852532,
    aliases: ['Education Faculty', 'Fac Edu']
  },
  {
    id: 'fac-social',
    name: 'Faculty of Social Sciences',
    category: Category.FACULTY,
    description: 'Houses Sociology, Psychology, Mass Communication, and Economics departments.',
    lat: 5.790118622722917,
    lng: 6.123229693464622,
    aliases: ['Social Science', 'Soc Sci', 'Economics']
  },
  {
    id: 'fac-mgt',
    name: 'Faculty of Management Sciences',
    category: Category.FACULTY,
    description: 'Accounting, Business Administration, Public Administration, and Banking & Finance.',
    lat: 5.792612669291927,
    lng: 6.11949473627754,
    aliases: ['Management Science', 'Mgt Sci', 'Business Admin']
  },
  {
    id: 'fac-pharmacy',
    name: 'Faculty of Pharmacy',
    category: Category.FACULTY,
    description: 'Pharmacy education facilities, clinical training, and pharmaceutical research.',
    lat: 5.7954519598580685,
    lng: 6.121651232363397,
    aliases: ['Pharmacy Faculty', 'Clinical Pharmacy']
  },
  {
    id: 'fac-bms',
    name: 'Faculty of Basic Medical Sciences',
    category: Category.FACULTY,
    description: 'Basic medical sciences education and research facilities.',
    lat: 5.788919435393658,
    lng: 6.12081438313605,
    aliases: ['Basic Medical Sciences', 'BMS']
  },

  // Admin
  {
    id: 'admin-senate',
    name: 'Senate Building',
    category: Category.ADMIN,
    description: 'Administrative heart of DELSU, housing the VC and Registrar offices.',
    lat: 5.790713001479814,
    lng: 6.099263698323783,
    aliases: ['Senate', 'VC Office', 'Admin Block', 'Registry']
  },
  {
    id: 'admin-admissions',
    name: 'Admissions Office',
    category: Category.ADMIN,
    description: 'Where prospective and fresh students process their enrollment.',
    lat: 5.7937,
    lng: 6.1035,
    aliases: ['Admissions', 'Enrollment Office']
  },

  // Lecture Theatres
  {
    id: 'lt-1',
    name: 'Lecture Theatre 1 (LT1)',
    category: Category.LECTURE_THEATRE,
    description: 'A major lecture venue often used for large general classes.',
    lat: 5.7946,
    lng: 6.1045,
    aliases: ['LT1', 'LT 1']
  },
  {
    id: 'lt-2',
    name: 'Lecture Theatre 2 (LT2)',
    category: Category.LECTURE_THEATRE,
    description: 'Central lecture theatre for combined science and general lectures.',
    lat: 5.7949,
    lng: 6.1049,
    aliases: ['LT2', 'LT 2']
  },
  {
    id: 'lt-new',
    name: 'New Lecture Theatre Complex',
    category: Category.LECTURE_THEATRE,
    description: 'Modern multi-hall lecture facility.',
    lat: 5.7958,
    lng: 6.1062,
    aliases: ['NLTC', 'New LT']
  },

  // Services
  {
    id: 'serv-library',
    name: 'University Library',
    category: Category.STUDENT_SERVICE,
    description: 'The main central university library with research and e-learning facilities.',
    lat: 5.789911487019828,
    lng: 6.09879679552501,
    aliases: ['Main Library', 'School Library', 'E-Library']
  },
  {
    id: 'serv-ict',
    name: 'ICT Centre',
    category: Category.STUDENT_SERVICE,
    description: 'Hub for digital services, CBT exams, portal registration, and IT support.',
    lat: 5.7940,
    lng: 6.1050,
    aliases: ['ICT', 'Computer Centre', 'CBT Centre']
  },

  // Hostels
  {
    id: 'hostel-male',
    name: 'Male Hostel (Hall of Residence)',
    category: Category.HOSTEL,
    description: 'Primary residential facility for male undergraduate students on campus.',
    lat: 5.7972,
    lng: 6.1080,
    aliases: ['Boys Hostel', 'Male Hall']
  },
  {
    id: 'hostel-nddc',
    name: 'NDDC Hostel (Hall of Residence)',
    category: Category.HOSTEL,
    description: 'Primary residential facility for female undergraduate students on campus.',
    lat: 5.788122690741658,
    lng: 6.119751195525033,
    aliases: ['Girls Hostel', 'Female Hall']
  },

  // Landmarks
  {
    id: 'gate-main',
    name: 'Main Gate (Site 3)',
    category: Category.LANDMARK,
    description: 'Primary entrance security checkpoint to DELSU Site 3.',
    lat: 5.785457600000022,
    lng: 6.118416428919932,
    aliases: ['Main Gate', 'First Gate', 'Site 3 Gate', 'School Entrance']
  },
  {
    id: 'stadium',
    name: 'Sports Complex / Stadium',
    category: Category.LANDMARK,
    description: 'Venue for sports, athletic activities, matriculation, and university events.',
    lat: 5.787224916656303,
    lng: 6.117389837852553,
    aliases: ['Stadium', 'Sports Ground', 'Sports Complex']
  }
];