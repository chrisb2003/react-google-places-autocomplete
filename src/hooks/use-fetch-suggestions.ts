import { useDebouncedCallback } from 'use-debounce';
import { Options } from 'react-select';

import { AutocompletionRequest } from '../types';
import autocompletionRequestBuilder from '../helpers/autocompletion-request-builder';

type CBType = (options: Options<any>) => void;
type UseFetchSuggestionsArg = {
  autocompletionRequest: AutocompletionRequest;
  debounce: number;
  minLengthAutocomplete: number;
  placesService?: google.maps.places.AutocompleteService;
  sessionToken?: google.maps.places.AutocompleteSessionToken;
  withSessionToken: boolean;
  suggestionsFilter?: (suggestions: google.maps.places.AutocompletePrediction[]) => google.maps.places.AutocompletePrediction[];
  blackListedPlaceIds: string[];
}

const useFetchSuggestions = (arg: UseFetchSuggestionsArg): ((value: string, cb: CBType) => void) =>
{
  const {
    autocompletionRequest,
    debounce,
    minLengthAutocomplete,
    placesService,
    sessionToken,
    withSessionToken,
    suggestionsFilter,
    blackListedPlaceIds,
  } = arg;

  const [fetchSuggestions] = useDebouncedCallback((value: string, cb: CBType): void =>
  {
    if (!placesService) return cb([]);
    if (value.length < minLengthAutocomplete) return cb([]);

    const autocompletionReq: AutocompletionRequest = { ...autocompletionRequest };

    placesService.getPlacePredictions(
      autocompletionRequestBuilder(
        autocompletionReq,
        value,
        withSessionToken && sessionToken,
      ), (suggestions) =>
    {
      let filteredSuggestions = suggestions || [];
      if (suggestionsFilter && suggestions) filteredSuggestions = suggestionsFilter(suggestions);

      // Google place_id's never allowed to be suggested
      if (blackListedPlaceIds.length > 0) {
        filteredSuggestions = filteredSuggestions!.filter((x) => !blackListedPlaceIds.includes(x.place_id));
      }

      // Illegal Address Places?
      const BOSAirport = filteredSuggestions!.find((x) => x.place_id === 'ChIJN0na1RRw44kRRFEtH8OUkww');
      if (BOSAirport) {
        BOSAirport.description = 'Boston Logan International Airport, 1 Harborside Dr, Boston, MA, 02128, USA';
      }

      cb((filteredSuggestions).map(suggestion => ({ label: suggestion.description, value: suggestion })));
    },
    );
  }, debounce);

  return fetchSuggestions;
}

export default useFetchSuggestions;
