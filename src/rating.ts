import vscode = require('vscode');

export async function updateActivationCount(context: vscode.ExtensionContext) {
    // Read the activation count from the globalState
    let activationCount =
        context.globalState.get<number>('activationCount') || 0;

    // Increment the activation count
    activationCount++;

    // Update the globalState with the incremented activation count
    await context.globalState.update('activationCount', activationCount);

    // Prompt the user for rating if needed
    await promptForRating(context, activationCount);
}

async function promptForRating(
    context: vscode.ExtensionContext,
    activationCount: number
) {
    // Check if the user has already provided a rating; if so, do not prompt again
    if (isRatingProvided(context)) {
        return;
    }

    if (activationCount % 20 === 0) {
        const rateButton = 'Rate Extension';
        const response = await vscode.window.showInformationMessage(
            'You have used this extension for a while. Would you like to rate it in Visual Studio Code Marketplace?',
            rateButton
        );

        if (response === rateButton) {
            const extensionId = encodeURIComponent(context.extension.id);
            const marketplaceUrl = `https://marketplace.visualstudio.com/items?itemName=${extensionId}&ssr=false#review-details`;
            vscode.env.openExternal(vscode.Uri.parse(marketplaceUrl));

            // Set the "rating provided" flag in the extension's global storage
            setRatingProvided(context);
        }
    }
}

function isRatingProvided(context: vscode.ExtensionContext): boolean {
    const ratingProvided = context.globalState.get<boolean>('ratingProvided');
    return ratingProvided || false;
}

function setRatingProvided(context: vscode.ExtensionContext): void {
    context.globalState.update('ratingProvided', true);
}
