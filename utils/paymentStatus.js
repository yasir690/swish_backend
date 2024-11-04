import authModel from "../model/authModel.js";
import purchaseModel from "../model/purchaseModel.js";

export const handlePayment = async (req, res) => {
  try {
    const { event } = req.body;
    console.log(event, "event");
    console.log(typeof event.app_user_id, "user_id type");

    const userfind = await authModel.findById(event.app_user_id);

    console.log(userfind, "userfind");

    console.log(
      typeof event.subscriber_attributes.purchase.value,
      "subscription_id type"
    );

    const foundPurchase = await purchaseModel.findById(
      event.subscriber_attributes.purchase.value
    );

    if (event.type === "INITIAL_PURCHASE") {
      console.log("initial purchase called");

      if (event.price > 0) {
        // Handle payment confirmation logic here
        if (event.product_id === "basic_sub_:basic") {
          console.log("initial purchase with monthly basic for android called");
          const currentDate = Date.now();
          const expiration = Date.now() + 30 * 24 * 60 * 60 * 1000;
          console.log(expiration, "expiration");

          foundPurchase.subscriptionLevel = "BASIC";
          foundPurchase.subscriptionType = "Monthly";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for monthly with initial purchase"
          );
        }

        if (event.product_id === "basic_sub_:basic-") {
          console.log(
            "initial purchase with annually basic for android called"
          );
          const currentDate = Date.now();

          const expiration = Date.now() + 365 * 24 * 60 * 60 * 1000;

          foundPurchase.subscriptionLevel = "BASIC";
          foundPurchase.subscriptionType = "Annually";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for annually with initial purchase"
          );
        }

        if (event.product_id === "basic_sub_:basic-plus") {
          console.log(
            "initial purchase with monthly basic plus for android called"
          );
          const currentDate = Date.now();
          const expiration = Date.now() + 30 * 24 * 60 * 60 * 1000;

          foundPurchase.subscriptionLevel = "BASIC_PLUS";
          foundPurchase.subscriptionType = "Monthly";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for annually with initial purchase"
          );
        }

        if (event.product_id === "basic_sub_:basic-plus-") {
          console.log(
            "initial purchase with annually basic plus for android called"
          );
          const currentDate = Date.now();

          const expiration = Date.now() + 365 * 24 * 60 * 60 * 1000;

          foundPurchase.subscriptionLevel = "BASIC_PLUS";
          foundPurchase.subscriptionType = "Annually";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for annually with initial purchase"
          );
        }

        if (event.product_id === "basic_sub_:basic-premium") {
          console.log(
            "initial purchase with monthly premium for android called"
          );
          const currentDate = Date.now();

          const expiration = Date.now() + 30 * 24 * 60 * 60 * 1000;

          foundPurchase.subscriptionLevel = "BASIC_PREMIUM";
          foundPurchase.subscriptionType = "Monthly";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for annually with initial purchase"
          );
        }

        if (event.product_id === "basic_sub_:basic-premium-") {
          console.log(
            "initial purchase with annually premium for android called"
          );
          const currentDate = Date.now();

          const expiration = Date.now() + 365 * 24 * 60 * 60 * 1000;

          foundPurchase.subscriptionLevel = "BASIC_PREMIUM";
          foundPurchase.subscriptionType = "Annually";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for annually with initial purchase"
          );
        }
        if (event.product_id === "basic_monthly") {
          console.log("initial purchase with monthly basic for ios called");
          const currentDate = Date.now();

          const expiration = Date.now() + 30 * 24 * 60 * 60 * 1000;

          foundPurchase.subscriptionLevel = "BASIC";
          foundPurchase.subscriptionType = "Monthly";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for annually with initial purchase"
          );
        }

        if (event.product_id === "basic_annual") {
          console.log("initial purchase with annually basic for ios called");
          const currentDate = Date.now();

          const expiration = Date.now() + 365 * 24 * 60 * 60 * 1000;

          foundPurchase.subscriptionLevel = "BASIC";
          foundPurchase.subscriptionType = "Annually";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for annually with initial purchase"
          );
        }
        if (event.product_id === "basic_plus_monthly") {
          console.log(
            "initial purchase with monthly basic plus for ios called"
          );
          const currentDate = Date.now();

          const expiration = Date.now() + 30 * 24 * 60 * 60 * 1000;

          foundPurchase.subscriptionLevel = "BASIC_PLUS";
          foundPurchase.subscriptionType = "Monthly";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for annually with initial purchase"
          );
        }

        if (event.product_id === "basic_plus_annual") {
          console.log(
            "initial purchase with annually basic plus for ios called"
          );
          const currentDate = Date.now();

          const expiration = Date.now() + 365 * 24 * 60 * 60 * 1000;

          foundPurchase.subscriptionLevel = "BASIC_PLUS";
          foundPurchase.subscriptionType = "Annually";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for annually with initial purchase"
          );
        }
        if (event.product_id === "basic_premium_monthly") {
          console.log("initial purchase with monthly premium for ios called");
          const currentDate = Date.now();

          const expiration = Date.now() + 30 * 24 * 60 * 60 * 1000;

          foundPurchase.subscriptionLevel = "BASIC_PREMIUM";
          foundPurchase.subscriptionType = "Monthly";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for annually with initial purchase"
          );
        }

        if (event.product_id === "basic_premium_annual") {
          console.log("initial purchase with annually premium for ios called");
          const currentDate = Date.now();

          const expiration = Date.now() + 365 * 24 * 60 * 60 * 1000;

          foundPurchase.subscriptionLevel = "BASIC_PREMIUM";
          foundPurchase.subscriptionType = "Annually";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for annually with initial purchase"
          );
        }
      } else {
        // No payment processed
        console.log(
          "INITIAL_PURCHASE processed but no payment charged:",
          event
        );
      }
    }

    if (event.type === "RENEWAL") {
      console.log("RENEWAL purchase called");
      if (event.price > 0) {
        // Handle payment confirmation logic here

        if (event.product_id === "basic_sub_:basic") {
          console.log("renewal purchase with monthly basic for android called");
          const currentDate = Date.now();
          const expiration = Date.now() + 30 * 24 * 60 * 60 * 1000;
          console.log(expiration, "expiration");

          foundPurchase.subscriptionLevel = "BASIC";
          foundPurchase.subscriptionType = "Monthly";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for monthly with initial purchase"
          );
        }

        if (event.product_id === "basic_sub_:basic-") {
          console.log(
            "renewal purchase with annually basic for android called"
          );
          const currentDate = Date.now();

          const expiration = Date.now() + 365 * 24 * 60 * 60 * 1000;

          foundPurchase.subscriptionLevel = "BASIC";
          foundPurchase.subscriptionType = "Annually";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for annually with initial purchase"
          );
        }

        if (event.product_id === "basic_sub_:basic-plus") {
          console.log(
            "renewal purchase with monthly basic plus for android called"
          );
          const currentDate = Date.now();
          const expiration = Date.now() + 30 * 24 * 60 * 60 * 1000;

          foundPurchase.subscriptionLevel = "BASIC_PLUS";
          foundPurchase.subscriptionType = "Monthly";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for annually with initial purchase"
          );
        }

        if (event.product_id === "basic_sub_:basic-plus-") {
          console.log(
            "renewal purchase with annually basic plus for android called"
          );
          const currentDate = Date.now();

          const expiration = Date.now() + 365 * 24 * 60 * 60 * 1000;

          foundPurchase.subscriptionLevel = "BASIC_PLUS";
          foundPurchase.subscriptionType = "Annually";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for annually with initial purchase"
          );
        }

        if (event.product_id === "basic_sub_:basic-premium") {
          console.log(
            "renewal purchase with monthly premium for android called"
          );
          const currentDate = Date.now();

          const expiration = Date.now() + 30 * 24 * 60 * 60 * 1000;

          foundPurchase.subscriptionLevel = "BASIC_PREMIUM";
          foundPurchase.subscriptionType = "Monthly";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for annually with initial purchase"
          );
        }

        if (event.product_id === "basic_sub_:basic-premium-") {
          console.log(
            "renewal purchase with annually premium for android called"
          );
          const currentDate = Date.now();

          const expiration = Date.now() + 365 * 24 * 60 * 60 * 1000;

          foundPurchase.subscriptionLevel = "BASIC_PREMIUM";
          foundPurchase.subscriptionType = "Annually";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for annually with initial purchase"
          );
        }
        if (event.product_id === "basic_monthly") {
          console.log("renewal purchase with monthly basic for ios called");
          const currentDate = Date.now();

          const expiration = Date.now() + 30 * 24 * 60 * 60 * 1000;

          foundPurchase.subscriptionLevel = "BASIC";
          foundPurchase.subscriptionType = "Monthly";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for annually with initial purchase"
          );
        }

        if (event.product_id === "basic_annual") {
          console.log("renewal purchase with annually basic for ios called");
          const currentDate = Date.now();

          const expiration = Date.now() + 365 * 24 * 60 * 60 * 1000;

          foundPurchase.subscriptionLevel = "BASIC";
          foundPurchase.subscriptionType = "Annually";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for annually with initial purchase"
          );
        }
        if (event.product_id === "basic_plus_monthly") {
          console.log(
            "renewal purchase with monthly basic plus for ios called"
          );
          const currentDate = Date.now();

          const expiration = Date.now() + 30 * 24 * 60 * 60 * 1000;

          foundPurchase.subscriptionLevel = "BASIC_PLUS";
          foundPurchase.subscriptionType = "Monthly";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for annually with initial purchase"
          );
        }

        if (event.product_id === "basic_plus_annual") {
          console.log(
            "renewal purchase with annually basic plus for ios called"
          );
          const currentDate = Date.now();

          const expiration = Date.now() + 365 * 24 * 60 * 60 * 1000;

          foundPurchase.subscriptionLevel = "BASIC_PLUS";
          foundPurchase.subscriptionType = "Annually";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for annually with initial purchase"
          );
        }
        if (event.product_id === "basic_premium_monthly") {
          console.log("renewal purchase with monthly premium for ios called");
          const currentDate = Date.now();

          const expiration = Date.now() + 30 * 24 * 60 * 60 * 1000;

          foundPurchase.subscriptionLevel = "BASIC_PREMIUM";
          foundPurchase.subscriptionType = "Monthly";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for annually with initial purchase"
          );
        }

        if (event.product_id === "basic_premium_annual") {
          console.log("renewal purchase with annually premium for ios called");
          const currentDate = Date.now();

          const expiration = Date.now() + 365 * 24 * 60 * 60 * 1000;

          foundPurchase.subscriptionLevel = "BASIC_PREMIUM";
          foundPurchase.subscriptionType = "Annually";
          foundPurchase.price = event.price;
          foundPurchase.expirationDate = expiration;
          foundPurchase.purchaseDate = currentDate;
          await foundPurchase.save();

          userfind.isPurchase = true;
          await userfind.save();

          console.log(
            "Payment processed successfully for annually with initial purchase"
          );
        }
      } else {
        // No payment processed
        console.log("Renewal processed but no payment charged:", event);
      }
    }

    // if(event.type==="CANCELLATION"){
    //   foundPurchase.subscriptionLevel = null;
    //   foundPurchase.subscriptionType=null;
    //   foundPurchase.price = 0;
    //   foundPurchase.expirationDate = null;
    //   await foundPurchase.save();

    //   userfind.isPurchase = false;
    //   await userfind.save();
    // }
    else {
      return res.status(400).json({
        success: true,
        message: "Unhandled event type",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
