import {
  Alert,
  AlertDescription,
  Badge,
  Box,
  Code,
  Divider,
  HStack,
  SkeletonText,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { CustomPlaceholder } from "../../../../types";
import { useCreateConnectionPreview } from "../../hooks";
import { InlineErrorAlert } from "../../../../components";
import { useDebounce } from "../../../../hooks";
import { CustomPlaceholderStepType } from "../../../../constants";
import { useUserFeedConnectionContext } from "../../../../contexts/UserFeedConnectionContext";

interface Props {
  customPlaceholder: CustomPlaceholder;
  selectedArticleId?: string;
  stepIndex: number;
}

export const CustomPlaceholderPreview = ({
  customPlaceholder: inputCustomPlaceholder,
  selectedArticleId,
  stepIndex,
}: Props) => {
  const { t } = useTranslation();
  const {
    articleFormatOptions,
    connection: { id: connectionId, key: connectionType },
    userFeed: { id: feedId },
  } = useUserFeedConnectionContext();
  const previewInputToDebounce: CustomPlaceholder[] = [
    {
      ...inputCustomPlaceholder,
      steps: inputCustomPlaceholder.steps.map((s) => {
        if (s.type === CustomPlaceholderStepType.Regex) {
          return {
            ...s,
            regexSearch: s.regexSearch.replaceAll("\\n", "\n"),
            // default flags by the backend. Set this default to minimize re-renders after saving
            // that causes the backend to automatically append gmi flags
            regexSearchFlags: s.regexSearchFlags || "gmi",
          };
        }

        return s;
      }),
    },
  ];
  const customPlaceholders = useDebounce(previewInputToDebounce, 500);
  const referenceName = customPlaceholders[0]?.referenceName;
  const customPlaceholder = customPlaceholders[0];

  const allStepsAreComplete = customPlaceholder.steps.every((s) => {
    if (!s.type || s.type === CustomPlaceholderStepType.Regex) {
      return !!s.regexSearch;
    }

    if (s.type === CustomPlaceholderStepType.DateFormat) {
      return !!s.format;
    }

    return true;
  });
  const placeholderIsComplete = !!(
    customPlaceholder.referenceName &&
    customPlaceholder.sourcePlaceholder &&
    allStepsAreComplete
  );

  const input = {
    enabled: placeholderIsComplete && !!selectedArticleId,
    data: {
      feedId,
      connectionId,
      data: {
        includeCustomPlaceholderPreviews: true,
        article: {
          id: selectedArticleId as string,
        },
        customPlaceholders,
        content: `{{custom::${referenceName}}}`,
        connectionFormatOptions: {
          formatTables: articleFormatOptions.formatTables,
          stripImages: articleFormatOptions.stripImages,
        },
      },
    },
  };

  const {
    data: dataPreview,
    fetchStatus: fetchStatusPreview,
    error,
  } = useCreateConnectionPreview(connectionType, input);

  const isFetchingNewPreview = fetchStatusPreview === "fetching";

  const previews = dataPreview?.result.customPlaceholderPreviews;

  let errorComponent = null;

  if (error?.statusCode === 422) {
    if (error.errorCode === "INVALID_CUSTOM_PLACEHOLDERS_REGEX_PREVIEW_INPUT") {
      errorComponent = (
        <Text fontSize={13} color="red.300" fontWeight={600}>
          Invalid regex search in current or previous steps
        </Text>
      );
    }
  } else if (error) {
    errorComponent = (
      <InlineErrorAlert description={error.message} title={t("common.errors.somethingWentWrong")} />
    );
  }

  const contentToDisplay = previews?.[0]?.[stepIndex];
  const showLoading = isFetchingNewPreview && placeholderIsComplete;

  return (
    <Stack spacing={4} flex={1}>
      <Box
        bg="whiteAlpha.200"
        borderStyle="solid"
        borderWidth="1px"
        borderColor="whiteAlpha.300"
        py={4}
        px={4}
        rounded="lg"
        minHeight={250}
        maxHeight={250}
        overflow={showLoading ? "hidden" : "auto"}
      >
        <HStack pb={2} flexWrap="wrap">
          <Badge variant="subtle" size="sm">
            Preview
          </Badge>
          <Code fontSize={12} display="inline-block">{`{{custom::${referenceName}}}`}</Code>
        </HStack>
        <Divider mt={1} mb={3} />
        {showLoading && <SkeletonText noOfLines={7} spacing="2" skeletonHeight="6" />}
        {!selectedArticleId && placeholderIsComplete && !isFetchingNewPreview && (
          <Text color="gray.400">
            <em>No article selected for preview</em>
          </Text>
        )}
        {!isFetchingNewPreview && placeholderIsComplete && previews && (
          <Box>
            {!contentToDisplay && (
              <Text color="gray.400">
                <em>(empty)</em>
              </Text>
            )}
            {contentToDisplay &&
              contentToDisplay.split("\n")?.map((line, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <span key={idx}>
                  <span>{line}</span>
                  <span> </span>
                  <br />
                </span>
              ))}
          </Box>
        )}
        {!isFetchingNewPreview &&
          placeholderIsComplete &&
          dataPreview?.result &&
          !dataPreview?.result.messages.length && (
            <Alert status="warning">
              <AlertDescription>
                <span>No article found for preview</span>
              </AlertDescription>
            </Alert>
          )}
        {errorComponent}
        {!error && !placeholderIsComplete && (
          <Text fontSize={13} color="red.300" fontWeight="600">
            Incomplete inputs in one or more steps
          </Text>
        )}
      </Box>
    </Stack>
  );
};
