import { BusId } from '../types';

export interface RouteStop {
  stop: string;
  time: string;
}

export interface BusData {
  id: BusId;
  label: string;
  name: string;
  routeTitle: string;
  driverName: string;
  phone?: string;
  stops: RouteStop[];
}

export const busData: Record<BusId, BusData> = {
  bus_1: {
    id: 'bus_1',
    label: 'Point 1 (Kotri Kabir)',
    name: 'BUS NO: 01 (GSF-317)',
    routeTitle: 'KOTRI KABIR - HINGORJA TO BBSUTSD, KHP',
    driverName: 'Umair Ali Dasti',
    stops: [
      { stop: 'Kotri Kabir', time: '6:40 am' },
      { stop: 'Hingorja', time: '7:00 am' },
      { stop: 'Shah G Machine', time: '7:05 am' },
      { stop: 'Gadiji', time: '7:08 am' },
      { stop: 'Ranipur Bypass', time: '7:20 am' },
      { stop: 'Gambat Bypass', time: '7:30 am' },
      { stop: 'Khuhra Bypass', time: '7:33 am' },
      { stop: 'Tando Masti Bypass', time: '7:45 am' },
      { stop: 'Shah Hussain Bypass', time: '8:00 am' },
      { stop: 'Luqman Phatak', time: '8:10 am' },
      { stop: 'Chandia Mor', time: '8:15 am' },
      { stop: 'University', time: '8:25 am' },
    ]
  },
  bus_2: {
    id: 'bus_2',
    label: 'Point 2 (Ahmed Pur)',
    name: 'BUS NO: 02 (GSF-321)',
    routeTitle: 'AHMED PUR TO BBSUTSD, KHP',
    driverName: 'Abdulallah Maitlo',
    stops: [
      { stop: 'Ahmed Pur', time: '6:50 am' },
      { stop: 'Dhang', time: '6:55 am' },
      { stop: 'Larik Stop', time: '6:57 am' },
      { stop: 'Kanhar Mor', time: '7:00 am' },
      { stop: 'Ansari Pump', time: '7:10 am' },
      { stop: 'Pir Goth Gate', time: '7:20 am' },
      { stop: 'Zahid Hotel', time: '7:25 am' },
      { stop: 'Wada Machi', time: '7:30 am' },
      { stop: 'Mang Taghar', time: '7:35 am' },
      { stop: 'Daud Goth', time: '7:40 am' },
      { stop: 'NLC Roda', time: '7:50 am' },
      { stop: 'Maryam Top', time: '8:00 am' },
      { stop: 'NBP Main Branch', time: '8:05 am' },
      { stop: 'Civic Center', time: '8:08 am' },
      { stop: 'Khaki Shah Pull', time: '8:12 am' },
      { stop: 'Luqman Phatak', time: '8:15 am' },
      { stop: 'Chandia Mor', time: '8:20 am' },
      { stop: 'University', time: '8:25 am' },
    ]
  },
  bus_3: {
    id: 'bus_3',
    label: 'Point 3 (Sukkur)',
    name: 'BUS NO: 03 (GSF-319)',
    routeTitle: 'SUKKUR & ROHRI TO BBSUTSD, KHP',
    driverName: 'Altaf Hussain',
    stops: [
      { stop: 'Main Bus Stand Sukkur', time: '6:30 am' },
      { stop: 'IBA Gate', time: '6:35 am' },
      { stop: 'Society Road', time: '6:40 am' },
      { stop: 'Shikarpur Phatak', time: '6:45 am' },
      { stop: 'Ayoub Gate', time: '6:50 am' },
      { stop: 'Shalimar', time: '6:55 am' },
      { stop: 'Hockey Ground', time: '7:03 am' },
      { stop: 'Zero Point', time: '7:05 am' },
      { stop: 'City Point', time: '7:10 am' },
      { stop: 'Beri Chock (Rohri)', time: '7:20 am' },
      { stop: 'Rohri City', time: '7:25 am' },
      { stop: 'Babrlo (Toll Plaza)', time: '7:35 am' },
      { stop: 'Babrlo Bypass', time: '7:40 am' },
      { stop: 'Ubhri', time: '7:45 am' },
      { stop: 'Karamabad', time: '7:50 am' },
      { stop: 'Thehri Bypass', time: '7:55 am' },
      { stop: 'Thehri Phatak', time: '8:05 am' },
      { stop: 'Maryam Cannon', time: '8:08 am' },
      { stop: 'Panjhati', time: '8:10 am' },
      { stop: 'Bilawal Parak', time: '8:15 am' },
      { stop: 'Chandia Mor', time: '8:20 am' },
      { stop: 'University', time: '8:25 am' },
    ]
  },
  bus_4: {
    id: 'bus_4',
    label: 'Point 4 (Chondko)',
    name: 'BUS NO: 04 (GSF-320)',
    routeTitle: 'CHONDKO TO BBSUTSD, KHP',
    driverName: 'Ghulam Qadir',
    stops: [
      { stop: 'Chondko', time: '6:40 am' },
      { stop: 'Sorah Chowk', time: '7:20 am' },
      { stop: 'Kot Banglo', time: '7:35 am' },
      { stop: 'Kot Digi (Sugar Mill Chowk)', time: '7:45 am' },
      { stop: 'Jumani Village', time: '7:50 am' },
      { stop: 'Sugar Mill (Gate)', time: '8:00 am' },
      { stop: 'Sugar Mill (Chowk)', time: '8:05 am' },
      { stop: 'Naroo Dhoro', time: '8:10 am' },
      { stop: 'Sohu Kinasra', time: '8:15 am' },
      { stop: 'Bakhar Kinasra', time: '8:20 am' },
      { stop: 'Janwari Goth', time: '8:22 am' },
      { stop: 'University', time: '8:25 am' },
    ]
  },
  bus_5: {
    id: 'bus_5',
    label: 'Point 5 (Sobhodero)',
    name: 'BUS NO: 05 (GSF-318)',
    routeTitle: 'SOBHODERO-KUMB TO BBSUTSD, KHP',
    driverName: 'Abdul Ghani',
    stops: [
      { stop: 'Sobhodero', time: '6:50 am' },
      { stop: 'Ranipur', time: '7:10 am' },
      { stop: 'Rajpar Village', time: '7:13 am' },
      { stop: 'Jhanda Shakh', time: '7:15 am' },
      { stop: 'Kumb', time: '7:20 am' },
      { stop: 'Arab Solangi', time: '7:25 am' },
      { stop: 'Kot Digi', time: '7:35 am' },
      { stop: 'Kot Banglo', time: '7:40 am' },
      { stop: 'Mithri', time: '7:55 am' },
      { stop: 'Wapda Gate', time: '8:10 am' },
      { stop: 'Burghri Pul', time: '8:15 am' },
      { stop: 'Chandia Mor', time: '8:20 am' },
      { stop: 'University', time: '8:25 am' },
    ]
  },
  bus_6: {
    id: 'bus_6',
    label: 'Point 6 (Thari Mirwah)',
    name: 'BUS NO: HINO (GS-9526)',
    routeTitle: 'THARI MIRWAH TO BBSUTSD, KHP',
    driverName: 'Yasir Hussain',
    stops: [
      { stop: 'Thari Mirwah', time: '6:30 am' },
      { stop: 'Hindyari', time: '6:35 am' },
      { stop: 'Bagh Bachrah', time: '6:45 am' },
      { stop: 'Sui Gas', time: '6:50 am' },
      { stop: 'Pir Budharo', time: '7:00 am' },
      { stop: 'Nangreja', time: '7:05 am' },
      { stop: 'Jhango Stop', time: '7:15 am' },
      { stop: 'Kumb', time: '7:25 am' },
      { stop: 'Arab Solangi', time: '7:30 am' },
      { stop: 'Kot Banglo', time: '7:45 am' },
      { stop: 'Mithri', time: '7:55 am' },
      { stop: 'Wapda Gate', time: '8:10 am' },
      { stop: 'Burghri Pul', time: '8:15 am' },
      { stop: 'Chandia Mor', time: '8:20 am' },
      { stop: 'University', time: '8:25 am' },
    ]
  },
  bus_7: {
    id: 'bus_7',
    label: 'Point 7 (City Route)',
    name: 'COASTER (GSF-325)',
    routeTitle: 'KHAIRPUR CITY ROUTE TIME SCHEDULE',
    driverName: 'Yasir Hussain (HTV)',
    phone: '0309-1347280',
    stops: [
      { stop: 'Sarki mor', time: '7:50 am' },
      { stop: 'Faizabad', time: '8:00 am' },
      { stop: 'Mumtaz Ground', time: '08:05 am' },
      { stop: 'National Bank', time: '08:08 am' },
      { stop: 'Civic Center', time: '08:11 am' },
      { stop: 'Khaki Shah pul', time: '08:15 am' },
      { stop: 'Luqman Fatak', time: '08:18 am' },
      { stop: 'Civil Hospital', time: '08:20 am' },
      { stop: 'Chandia mor', time: '08:23 am' },
      { stop: 'University', time: '08:25 am' },
    ]
  }
};
