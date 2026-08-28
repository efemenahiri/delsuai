import { supabase } from './supabase';
import { Location } from '../types';

export async function fetchLocations(): Promise<Location[]> {
    const { data, error } = await supabase
        .from('locations')
        .select('*');

    if (error) {
        console.error('Error fetching locations from Supabase:', error);
        return [];
    }

    return data || [];
}